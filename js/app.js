/**
 * Loads the Google Maps JavaScript API asynchronously.
 *
 * The API key comes from config.local.js, which is excluded from Git.
 */
function updateMapStatus(title, message) {
    const status = document.getElementById("map-status");
    const titleElement =
        document.getElementById("map-status-title");
    const messageElement =
        document.getElementById("map-status-message");

    if (!status || !titleElement || !messageElement) {
        return;
    }

    status.hidden = false;
    status.classList.remove("map-status--error");

    titleElement.textContent = title;
    messageElement.textContent = message;
}

function hideMapStatus() {
    const status = document.getElementById("map-status");

    if (status) {
        status.hidden = true;
    }
}

function showMapError(error) {
    const status = document.getElementById("map-status");

    if (!status) {
        console.error("Application failed to start:", error);
        return;
    }

    status.hidden = false;
    status.classList.add("map-status--error");

    status.innerHTML = `
        <div class="map-status__content">
            <h2>Map Unavailable</h2>

            <p>
                The resource map could not be loaded.
                Please check your connection and try again.
            </p>

            <button
                type="button"
                class="map-status__retry"
                id="map-status-retry"
            >
                Try Again
            </button>
        </div>
    `;

    document
        .getElementById("map-status-retry")
        ?.addEventListener("click", () => {
            window.location.reload();
        });

    console.error("Application failed to start:", error);
}
function loadGoogleMapsApi() {

    // Avoid loading Google Maps more than once.
    if (window.google?.maps?.importLibrary) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {

        const callbackName = "googleMapsApiLoaded";

        window[callbackName] = () => {
            delete window[callbackName];
            resolve();
        };

        const parameters = new URLSearchParams({
            key: CONFIG.googleMaps.apiKey,
            v: "weekly",
            loading: "async",
            callback: callbackName
        });

        const script = document.createElement("script");

        script.src =
            `https://maps.googleapis.com/maps/api/js?${parameters.toString()}`;

        script.async = true;

        script.onerror = () => {
            delete window[callbackName];

            reject(
                new Error("The Google Maps JavaScript API could not be loaded.")
            );
        };

        document.head.appendChild(script);
    });
}
function updateNearbyResults() {

    const resultsList =
        document.getElementById(
            "resource-results-list"
        );

    const resultsText =
        document.getElementById(
            "resource-search-results"
        );

    if (
        !resultsList ||
        !resultsText ||
        !window.mapManager.userLocation
    ) {
        return;
    }

    const nearbyMarkers =
        window.mapManager
            .getMarkersSortedByDistance(
                window.mapManager.userLocation,
                window.mapManager.visibleMarkers
            );

    resultsList.innerHTML = "";

    for (const marker of nearbyMarkers) {

        const card =
            window.resultCardBuilder.build(
                marker
            );

        resultsList.appendChild(card);
    }

    if (nearbyMarkers.length === 0) {

        const radius =
            window.mapManager
                .nearMeRadiusMiles;

        resultsText.textContent =
            radius !== null
                ? `No resources found within ${radius} miles`
                : "No nearby resources found";

        return;
    }

    resultsText.textContent =
        nearbyMarkers.length === 1
            ? "1 nearby resource"
            : `${nearbyMarkers.length} nearby resources`;
}

/**
 * Connects the sidebar buttons to the map filtering system.
 */
function initializeFilterButtons() {
    const container =
        document.getElementById("resource-filter-buttons");

    if (!container) {
        console.error(
            "Resource filter button container could not be found."
        );
        return;
    }

    const preferredCategoryOrder =
    CONFIG.resourceCategories?.order ?? [];

    const categories =
        window.resourceManager.getCategories();

    /*
     * Known categories follow our preferred order.
     */
    const knownCategories =
        preferredCategoryOrder.filter(
            (category) =>
                categories.includes(category)
        );

    /*
     * Any category we did not predefine still works.
     * Unknown categories appear alphabetically after
     * the known categories.
     */
    const unknownCategories =
        categories
            .filter(
                (category) =>
                    !preferredCategoryOrder.includes(
                        category
                    )
            )
            .sort(
                (firstCategory, secondCategory) =>
                    firstCategory.localeCompare(
                        secondCategory
                    )
            );

    const orderedCategories = [
        ...knownCategories,
        ...unknownCategories
    ];

    container.innerHTML = "";

    /*
     * "All" always exists because it represents
     * every currently active resource.
     */
    const allButton =
        document.createElement("button");

    allButton.type = "button";
    allButton.textContent = "All";
    allButton.dataset.category = "All";
    allButton.classList.add(
        "resource-filter-button"
    );

    allButton.addEventListener(
        "click",
        () => {
            window.mapManager.filterMarkers(
                "All"
            );
            updateNearbyResults();
        }
    );

    container.appendChild(allButton);

    /*
     * Build one button for each category that
     * actually contains active resources.
     */
    for (const category of orderedCategories) {
        const button =
            document.createElement("button");

        button.type = "button";
        button.textContent = category;
        button.dataset.category = category;

        button.classList.add(
            "resource-filter-button"
        );

        button.addEventListener(
            "click",
            () => {
                window.mapManager.filterMarkers(
                    category
                );
                updateNearbyResults();
            }
        );

        container.appendChild(button);
    }

    console.log(
        "Resource filter buttons created:",
        [
            "All",
            ...orderedCategories
        ]
    );
}

function initializeResourceSearch() {
    const searchControls =
    document.querySelector(
        ".resource-search__controls"
    );
    const searchInput =
        document.getElementById("resource-search-input");

    const searchButton =
        document.getElementById("resource-search-submit");

    const clearButton =
        document.getElementById("resource-search-clear");

    const resultsText =
        document.getElementById("resource-search-results");

        const resultsList =
    document.getElementById("resource-results-list");

    if (
    !searchControls ||
    !searchInput ||
    !searchButton ||
    !clearButton ||
    !resultsText ||
    !resultsList
) {
    console.error("Search controls could not be initialized.", {
        searchInput,
        searchButton,
        clearButton,
        resultsText,
        resultsList
    });

    return;
}

const runSearch = () => {
    const query = searchInput.value.trim();

    const visibleMarkers =
        window.mapManager.searchMarkers(query, true);

    const resultCount = visibleMarkers.length;

    resultsList.innerHTML = "";

    for (const marker of visibleMarkers) {
    const card =
        window.resultCardBuilder.build(marker);

    resultsList.appendChild(card);
}

    clearButton.hidden = query === "";
    searchControls.classList.toggle(
    "resource-search__controls--with-clear",
    query !== ""
);

    if (query === "") {
        resultsText.textContent = "";
        resultsList.innerHTML = "";
        return;
    }

    resultsText.textContent =
        resultCount === 1
            ? "1 resource found"
            : `${resultCount} resources found`;
};

    searchButton.addEventListener("click", runSearch);

    searchInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            runSearch();
        }
    });

    clearButton.addEventListener("click", () => {
        searchInput.value = "";

        window.mapManager.searchMarkers("", true);

        clearButton.hidden = true;
        searchControls.classList.remove(
    "resource-search__controls--with-clear"
);
        resultsText.textContent = "";
        resultsList.innerHTML = "";

        searchInput.focus();
    });
}
function initializeNearMe() {

    const button =
        document.getElementById(
            "near-me-button"
        );

    const resetButton =
        document.getElementById(
            "near-me-reset"
        );

    const status =
        document.getElementById(
            "near-me-status"
        );

    const radiusContainer =
        document.getElementById(
            "near-me-radius-container"
        );

    const radiusSelect =
        document.getElementById(
            "near-me-radius"
        );

    if (
        !button ||
        !resetButton ||
        !status ||
        !radiusContainer ||
        !radiusSelect
    ) {
        console.error(
            "Near Me controls could not be initialized."
        );

        return;
    }

    button.addEventListener(
        "click",
        async () => {

            status.textContent =
                "Finding your location...";

            button.disabled = true;

            let location;
            let isTestLocation = false;

            try {
                location =
                    await window.locationManager
                        .getCurrentLocation();
            }
            catch (locationError) {

                console.warn(
                    "Live location unavailable. " +
                    "Using the development test location.",
                    locationError
                );

                        location = {
            ...CONFIG.map.defaultCenter
                };

                isTestLocation = true;
            }

            try {

                window.mapManager
                    .createUserLocationMarker(
                        location
                    );

                /*
                 * Default Near Me radius.
                 */
                window.mapManager
                    .setNearMeRadius(
                        radiusSelect.value
                    );

                updateNearbyResults();

                radiusContainer.hidden =
                    false;

                resetButton.hidden =
                    false;

                status.textContent =
                    isTestLocation
                        ? `Using test location: ${CONFIG.client.name}`
                        : "Location found";
            }
            catch (processingError) {

                console.error(
                    "Near Me processing failed:",
                    processingError
                );

                status.textContent =
                    "Location was found, but nearby " +
                    "resources could not be calculated.";
            }
            finally {
                button.disabled = false;
            }
        }
    );

    radiusSelect.addEventListener(
        "change",
        () => {

            window.mapManager
                .setNearMeRadius(
                    radiusSelect.value
                );

            updateNearbyResults();
        }
    );

    resetButton.addEventListener(
        "click",
        () => {

            window.mapManager
                .clearUserLocation();

            const resultsList =
                document.getElementById(
                    "resource-results-list"
                );

            const resultsText =
                document.getElementById(
                    "resource-search-results"
                );

            if (resultsList) {
                resultsList.innerHTML = "";
            }

            if (resultsText) {
                resultsText.textContent = "";
            }

            status.textContent = "";

            resetButton.hidden = true;
            radiusContainer.hidden = true;

            radiusSelect.value = "5";
        }
    );
}

function initializeMobileSidebar() {
    const sidebar =
        document.getElementById("resource-sidebar");

    const button =
        document.getElementById("mobile-resource-button");

    if (!sidebar || !button) {
        console.warn(
            "Mobile resource controls could not be initialized."
        );

        return;
    }

    button.addEventListener("click", () => {
        sidebar.classList.toggle("sidebar--open");
    });
}

function initializeClientBranding() {
        const brandColor =
        CONFIG.client?.brandColor;

    if (brandColor) {
        document.documentElement.style.setProperty(
            "--brand-primary",
            brandColor
        );
    }

    const pageTitle =
        document.getElementById("page-title");

    const mapTitle =
        document.getElementById("map-title");

    const title =
        CONFIG.demo?.enabled
            ? CONFIG.client.demoMapTitle
            : CONFIG.client.mapTitle;

    document.title = title;

    if (pageTitle) {
        pageTitle.textContent = title;
    }

    if (mapTitle) {
        mapTitle.textContent = title;
    }
}

function initializeDemoMode() {

    const overlay =
        document.getElementById(
            "demo-overlay"
        );

    const dismissButton =
        document.getElementById(
            "demo-overlay-dismiss"
        );

    const title =
        document.getElementById(
            "demo-overlay-title"
        );

    const message =
        document.getElementById(
            "demo-overlay-message"
        );

    if (!overlay || !dismissButton) {
        console.warn(
            "Demo mode controls could not be initialized."
        );

        return;
    }

    // Populate demo content from config.
    if (title) {
        title.textContent =
            CONFIG.demo.title;
    }

    if (message) {
        message.textContent =
            CONFIG.demo.message;
    }

    dismissButton.textContent =
        CONFIG.demo.buttonText;

    const demoEnabled =
        CONFIG.demo?.enabled === true;

    if (!demoEnabled) {
        overlay.hidden = true;

        document.body.classList.remove(
            "demo-mode-active"
        );

        return;
    }

    overlay.hidden = false;

    document.body.classList.add(
        "demo-mode-active"
    );

    dismissButton.addEventListener(
        "click",
        () => {

            overlay.hidden = true;

            document.body.classList.remove(
                "demo-mode-active"
            );
        }
    );
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("Application starting...");

    initializeClientBranding();
    initializeDemoMode();

    try {
        updateMapStatus(
            "Loading Resource Map",
            "Connecting to Google Maps..."
        );

        await loadGoogleMapsApi();

        updateMapStatus(
            "Loading Resource Map",
            `Loading ${CONFIG.client.name} resources...`
        );

        await window.mapManager.initialize();

        updateMapStatus(
            "Loading Resource Map",
            "Preparing map controls..."
        );

        initializeFilterButtons();
        initializeResourceSearch();
        initializeNearMe();
        initializeMobileSidebar();

        hideMapStatus();

        console.log("Application ready.");

    } catch (error) {
        showMapError(error);
    }
});