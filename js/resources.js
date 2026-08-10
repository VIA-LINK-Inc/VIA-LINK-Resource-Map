class ResourceManager {

    constructor() {
        this.resources = [];
        this.categories = [];

        /*
         * Tabs with these names are never treated
         * as public resource categories.
         *
         * Comparison is case-insensitive.
         */
        this.ignoredSheetNames = new Set([
            "instructions",
            "template",
            "archive"
        ]);

        /*
         * A sheet must contain these columns
         * before it can be treated as a resource tab.
         */
        this.requiredHeaders = [
            "resource",
            "latitude",
            "longitude",
            "active"
        ];
    }

    async loadResources() {
        console.log(
            "Loading resources from Google Sheets..."
        );

        const {
            spreadsheetId
        } = CONFIG.googleSheets;

        const apiKey =
            CONFIG.googleMaps.apiKey;

        if (
            !spreadsheetId ||
            spreadsheetId === "SPREADSHEET_ID_HERE"
        ) {
            throw new Error(
                "A Google Sheets spreadsheet ID was not configured."
            );
        }

        /*
         * First discover which tabs currently exist.
         */
        const sheetNames =
            await this.discoverResourceSheetNames(
                spreadsheetId,
                apiKey
            );

        if (sheetNames.length === 0) {
            throw new Error(
                "No usable Google Sheets resource tabs were found."
            );
        }

        /*
         * Load all discovered tabs in one batch request.
         */
        const valueRanges =
            await this.fetchSheetValues(
                spreadsheetId,
                apiKey,
                sheetNames
            );

        const rawResources = [];
        const validCategories = [];

        sheetNames.forEach(
            (sheetName, sheetIndex) => {

                const sheetRows =
                    valueRanges[sheetIndex]?.values ?? [];

                if (sheetRows.length === 0) {
                    console.warn(
                        `No data found on the "${sheetName}" tab.`
                    );

                    return;
                }

                const headers =
                    this.normalizeHeaders(
                        sheetRows[0]
                    );

                if (
                    !this.hasRequiredHeaders(headers)
                ) {
                    console.warn(
                        `Skipping "${sheetName}" because it does not ` +
                        "contain the required resource columns.",
                        {
                            requiredHeaders:
                                this.requiredHeaders,
                            foundHeaders:
                                headers
                        }
                    );

                    return;
                }

                const dataRows =
                    sheetRows.slice(1);

                let validRowFound = false;

                dataRows.forEach(
                    (row, rowIndex) => {

                        const rowData =
                            this.convertRowToObject(
                                headers,
                                row
                            );

                        /*
                         * Ignore completely empty spreadsheet rows.
                         */
                        if (
                            !this.rowContainsData(rowData)
                        ) {
                            return;
                        }

                        const resourceData =
                            this.convertObjectToResourceData(
                                rowData,
                                rowIndex,
                                sheetName
                            );

                        /*
                         * Active controls whether the resource
                         * appears on the public map.
                         */
                        if (!resourceData.active) {
                            return;
                        }

                        rawResources.push(
                            resourceData
                        );

                        validRowFound = true;
                    }
                );

                if (validRowFound) {
                    validCategories.push(
                        sheetName
                    );
                }
            }
        );

        this.resources =
            rawResources
                .map(
                    (data) =>
                        new window.Resource(data)
                )
                .filter((resource) => {

                    if (resource.isValid()) {
                        return true;
                    }

                    console.warn(
                        "Invalid resource skipped:",
                        resource
                    );

                    return false;
                });

        /*
         * Only categories containing at least one
         * active resource are exposed to the UI.
         */
        this.categories = [
            ...new Set(validCategories)
        ];

        console.log(
            `${this.resources.length} active resources loaded ` +
            `from ${this.categories.length} resource categories.`
        );

        console.log(
            "Resource categories:",
            this.categories
        );

        return this.resources;
    }

    /**
     * Requests spreadsheet metadata so the application
     * can discover tabs automatically.
     */
    async discoverResourceSheetNames(
        spreadsheetId,
        apiKey
    ) {
        const parameters =
            new URLSearchParams({
                key: apiKey,
                fields:
                    "sheets.properties(title,hidden,sheetType)"
            });

        const requestUrl =
            "https://sheets.googleapis.com/v4/spreadsheets/" +
            `${encodeURIComponent(spreadsheetId)}` +
            `?${parameters.toString()}`;

        const response =
            await fetch(requestUrl);

        if (!response.ok) {
            const errorDetails =
                await response.text();

            throw new Error(
                "Unable to discover Google Sheets tabs. " +
                `HTTP status: ${response.status}. ` +
                `Details: ${errorDetails}`
            );
        }

        const result =
            await response.json();

        const sheets =
            result.sheets ?? [];

        const sheetNames =
            sheets
                .map(
                    (sheet) =>
                        sheet.properties
                )
                .filter((properties) => {

                    if (!properties) {
                        return false;
                    }

                    /*
                     * Only normal spreadsheet grid tabs
                     * should be considered.
                     */
                    if (
                        properties.sheetType &&
                        properties.sheetType !== "GRID"
                    ) {
                        return false;
                    }

                    /*
                     * Hidden tabs are ignored.
                     */
                    if (properties.hidden) {
                        return false;
                    }

                    const normalizedName =
                        String(
                            properties.title ?? ""
                        )
                            .trim()
                            .toLowerCase();

                    if (
                        this.ignoredSheetNames.has(
                            normalizedName
                        )
                    ) {
                        return false;
                    }

                    return true;
                })
                .map(
                    (properties) =>
                        properties.title
                );

        console.log(
            "Discovered Google Sheets tabs:",
            sheetNames
        );

        return sheetNames;
    }

    /**
     * Loads the values from every discovered tab
     * in one Google Sheets API request.
     */
    async fetchSheetValues(
        spreadsheetId,
        apiKey,
        sheetNames
    ) {
        const parameters =
            new URLSearchParams({
                key: apiKey,
                majorDimension: "ROWS"
            });

        for (const sheetName of sheetNames) {
            parameters.append(
                "ranges",
                `${this.quoteSheetName(sheetName)}!A:Z`
            );
        }

        const requestUrl =
            "https://sheets.googleapis.com/v4/spreadsheets/" +
            `${encodeURIComponent(spreadsheetId)}` +
            "/values:batchGet?" +
            parameters.toString();

        const response =
            await fetch(requestUrl);

        if (!response.ok) {
            const errorDetails =
                await response.text();

            throw new Error(
                "Unable to load Google Sheet resources. " +
                `HTTP status: ${response.status}. ` +
                `Details: ${errorDetails}`
            );
        }

        const result =
            await response.json();

        return result.valueRanges ?? [];
    }

    /**
     * Makes a Google Sheets tab name safe for use
     * inside an A1-style range.
     */
    quoteSheetName(sheetName) {
        const escapedName =
            String(sheetName)
                .replace(/'/g, "''");

        return `'${escapedName}'`;
    }

    /**
     * Normalizes spreadsheet headers so differences
     * in capitalization, spaces, underscores, and
     * hyphens do not matter.
     *
     * Examples:
     * "Phone"       -> "phone"
     * "PHONE"       -> "phone"
     * "Phone Number" -> "phonenumber"
     * "phone_number" -> "phonenumber"
     */
    normalizeHeaders(headerRow) {
        return headerRow.map(
            (header) =>
                this.normalizeHeader(header)
        );
    }

    normalizeHeader(header) {
        return String(header ?? "")
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "");
    }

    /**
     * Ensures a tab looks like a resource tab before
     * trying to process its rows.
     */
    hasRequiredHeaders(headers) {
        return this.requiredHeaders.every(
            (requiredHeader) =>
                headers.includes(
                    this.normalizeHeader(
                        requiredHeader
                    )
                )
        );
    }

    convertRowToObject(headers, row) {
        const rowData = {};

        headers.forEach(
            (header, columnIndex) => {

                if (!header) {
                    return;
                }

                rowData[header] =
                    row[columnIndex] ?? "";
            }
        );

        return rowData;
    }

    /**
     * Prevents blank spreadsheet rows from being
     * treated as resources.
     */
    rowContainsData(rowData) {
        return Object.values(rowData)
            .some(
                (value) =>
                    String(value ?? "")
                        .trim() !== ""
            );
    }

    convertObjectToResourceData(
        rowData,
        rowIndex,
        sheetName
    ) {
        const latitude =
            Number(rowData.latitude);

        const longitude =
            Number(rowData.longitude);

        return {
            /*
             * Internal ID only.
             * Spreadsheet users do not maintain IDs.
             */
            id:
                `${sheetName}-${rowIndex + 2}`,

            /*
             * The spreadsheet's Resource column
             * becomes Resource.name internally.
             */
            name:
                rowData.resource ?? "",

            /*
             * The tab name becomes the category.
             */
            category:
                sheetName,

            address:
                rowData.address ?? "",

            latitude,
            longitude,

            parish:
                rowData.parish ?? "",

            description:
                rowData.description ?? "",

            hours:
                rowData.hours ?? "",

            phone:
                rowData.phone ?? "",

            email:
                rowData.email ?? "",

            website:
                rowData.website ?? "",

            active:
                this.convertToBoolean(
                    rowData.active
                )
        };
    }

    convertToBoolean(value) {
        if (typeof value === "boolean") {
            return value;
        }

        const normalizedValue =
            String(value ?? "")
                .trim()
                .toLowerCase();

        return (
            normalizedValue === "true" ||
            normalizedValue === "yes" ||
            normalizedValue === "1" ||
            normalizedValue === "checked"
        );
    }

    /**
     * Allows the UI layer to ask which categories
     * were actually loaded.
     */
    getCategories() {
        return [...this.categories];
    }
}

window.resourceManager =
    new ResourceManager();