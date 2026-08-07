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


/**
 * Connects the sidebar buttons to the map filtering system.
 */
function initializeFilterButtons() {

    const filters = [
        ["filter-all", "All"],
        ["filter-food", "Food"],
        ["filter-shelter", "Shelter"],
        ["filter-medical", "Medical"],
        ["filter-charging", "Charging"]
    ];

    for (const [buttonId, category] of filters) {

        const button = document.getElementById(buttonId);

        if (!button) {
            console.warn(`Filter button not found: ${buttonId}`);
            continue;
        }

        button.addEventListener("click", () => {
            window.mapManager.filterMarkers(category);
        });
    }
}

function initializeResourceSearch() {
    const searchInput =
        document.getElementById("resource-search-input");

    const searchButton =
        document.getElementById("resource-search-submit");

    const clearButton =
        document.getElementById("resource-search-clear");

    const zoomButton =
        document.getElementById("resource-search-zoom");

    const resultsText =
        document.getElementById("resource-search-results");

        const resultsList =
    document.getElementById("resource-results-list");

    if (
    !searchInput ||
    !searchButton ||
    !clearButton ||
    !zoomButton ||
    !resultsText ||
    !resultsList
) {
    console.error("Search controls could not be initialized.", {
        searchInput,
        searchButton,
        clearButton,
        zoomButton,
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
    zoomButton.hidden = resultCount <= 1;

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
        zoomButton.hidden = true;
        resultsText.textContent = "";
        resultsList.innerHTML = "";

        searchInput.focus();
    });

    zoomButton.addEventListener("click", () => {
        window.mapManager.zoomToFilteredMarkers();
    });
}
function initializeNearMe() {
    const button =
        document.getElementById("near-me-button");

    const resetButton =
        document.getElementById("near-me-reset");

    const status =
        document.getElementById("near-me-status");

    if (!button || !resetButton || !status) {
        console.error("Near Me controls could not be initialized.");
        return;
    }

    button.addEventListener("click", async () => {
        status.textContent = "Finding your location...";
        button.disabled = true;

        let location;
        let isTestLocation = false;

        try {
            location =
                await window.locationManager.getCurrentLocation();
        }
        catch (locationError) {
            console.warn(
                "Live location unavailable. Using the development test location.",
                locationError
            );

            location = {
                lat: 29.9511,
                lng: -90.0715
            };

            isTestLocation = true;
        }

        try {
            window.mapManager.createUserLocationMarker(location);

            const sortedMarkers =
                window.mapManager.getMarkersSortedByDistance(
                    location
                );

            const resultsList =
                document.getElementById(
                    "resource-results-list"
                );

            const resultsText =
                document.getElementById(
                    "resource-search-results"
                );

            if (resultsList && resultsText) {
                resultsList.innerHTML = "";

                for (const marker of sortedMarkers) {
                    const card =
                        window.resultCardBuilder.build(marker);

                    resultsList.appendChild(card);
                }

                resultsText.textContent =
                    sortedMarkers.length === 1
                        ? "1 nearby resource"
                        : `${sortedMarkers.length} nearby resources`;
            }

            status.textContent = isTestLocation
                ? "Using test location: New Orleans"
                : "Location found";

            resetButton.hidden = false;
        }
        catch (processingError) {
            console.error(
                "Near Me processing failed:",
                processingError
            );

            status.textContent =
                "Location was found, but nearby resources could not be calculated.";
        }
        finally {
            button.disabled = false;
        }
    });

    resetButton.addEventListener("click", () => {
        window.mapManager.clearUserLocation();

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

        window.mapManager.searchMarkers("", true);
    });
}
document.addEventListener("DOMContentLoaded", async () => {
    console.log("Application starting...");

    try {
        updateMapStatus(
            "Loading Resource Map",
            "Connecting to Google Maps..."
        );

        await loadGoogleMapsApi();

        updateMapStatus(
            "Loading Resource Map",
            "Loading VIA LINK resources..."
        );

        await window.mapManager.initialize();

        updateMapStatus(
            "Loading Resource Map",
            "Preparing map controls..."
        );

        initializeFilterButtons();
        initializeResourceSearch();
        initializeNearMe();

        hideMapStatus();

        console.log("Application ready.");

    } catch (error) {
        showMapError(error);
    }
});