class ResourceManager {

    constructor() {
        this.resources = [];
    }

    async loadResources() {
        console.log("Loading resources from Google Sheets...");

        const {
            spreadsheetId,
            resourceSheets,
            range
        } = CONFIG.googleSheets;

        const apiKey = CONFIG.googleMaps.apiKey;

        if (
            !spreadsheetId ||
            spreadsheetId === "SPREADSHEET_ID_HERE"
        ) {
            throw new Error(
                "A Google Sheets spreadsheet ID was not configured."
            );
        }

        if (
            !Array.isArray(resourceSheets) ||
            resourceSheets.length === 0
        ) {
            throw new Error(
                "No Google Sheets resource tabs were configured."
            );
        }

        const parameters = new URLSearchParams({
            key: apiKey,
            majorDimension: "ROWS"
        });

        for (const sheet of resourceSheets) {
            parameters.append(
                "ranges",
                `${sheet.sheetName}!${range}`
            );
        }

        const requestUrl =
            `https://sheets.googleapis.com/v4/spreadsheets/` +
            `${encodeURIComponent(spreadsheetId)}/values:batchGet?` +
            parameters.toString();

        const response = await fetch(requestUrl);

        if (!response.ok) {
            const errorDetails = await response.text();

            throw new Error(
                `Unable to load Google Sheet resources. ` +
                `HTTP status: ${response.status}. ` +
                `Details: ${errorDetails}`
            );
        }

        const result = await response.json();
        const valueRanges = result.valueRanges ?? [];
        const rawResources = [];

        resourceSheets.forEach((sheetConfig, sheetIndex) => {

            const sheetRows =
                valueRanges[sheetIndex]?.values ?? [];

            if (sheetRows.length === 0) {
                console.warn(
                    `No data found on the ${sheetConfig.sheetName} tab.`
                );

                return;
            }

            const headers = this.normalizeHeaders(sheetRows[0]);
            const dataRows = sheetRows.slice(1);

            dataRows.forEach((row, rowIndex) => {

                const rowData =
                    this.convertRowToObject(headers, row);

                const resourceData =
                    this.convertObjectToResourceData(
                        rowData,
                        rowIndex,
                        sheetConfig
                    );

                if (resourceData.active) {
                    rawResources.push(resourceData);
                }
            });
        });

        this.resources = rawResources
            .map((data) => new window.Resource(data))
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

        console.log(
            `${this.resources.length} active resources loaded ` +
            `from ${resourceSheets.length} Google Sheets tabs.`
        );

        return this.resources;
    }

    normalizeHeaders(headerRow) {
        return headerRow.map((header) =>
            String(header ?? "")
                .trim()
                .toLowerCase()
                .replace(/\s+/g, "_")
        );
    }

    convertRowToObject(headers, row) {
        const rowData = {};

        headers.forEach((header, columnIndex) => {

            if (!header) {
                return;
            }

            rowData[header] = row[columnIndex] ?? "";
        });

        return rowData;
    }

    convertObjectToResourceData(
        rowData,
        rowIndex,
        sheetConfig
    ) {
        return {
    // Internal ID; not maintained in the spreadsheet.
    id: `${sheetConfig.sheetName}-${rowIndex + 2}`,

    name: rowData.name ?? "",
    category: sheetConfig.category,
    address: rowData.address ?? "",

    latitude: Number(rowData.latitude),
longitude: Number(rowData.longitude),

location: {
    lat: Number(rowData.latitude),
    lng: Number(rowData.longitude)
},

    phone: rowData.phone ?? "",
    email: rowData.email ?? "",
    website: rowData.website ?? "",
    hours: rowData.hours ?? "",
    notes: rowData.notes ?? "",
    languages: rowData.languages ?? "",
    lastUpdated: rowData.last_updated ?? "",
            adaAccessible:
                this.convertToBoolean(
                    rowData.ada_accessible
                ),

            petFriendly:
                this.convertToBoolean(
                    rowData.pet_friendly
                ),

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
}

window.resourceManager = new ResourceManager();