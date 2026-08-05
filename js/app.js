/**
 * Loads the Google Maps JavaScript API asynchronously.
 *
 * The API key comes from config.local.js, which is excluded from Git.
 */
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


document.addEventListener("DOMContentLoaded", async () => {

    console.log("Application starting...");

    try {

        await loadGoogleMapsApi();

        await window.mapManager.initialize();

        initializeFilterButtons();

        console.log("Application ready.");

    } catch (error) {

        console.error("Application failed to start:", error);

        const mapElement = document.getElementById("map");

        if (mapElement) {
            mapElement.innerHTML = `
                <div style="padding: 24px;">
                    <h2>Map unavailable</h2>
                    <p>
                        The resource map could not be loaded.
                        Please refresh the page or try again later.
                    </p>
                </div>
            `;
        }
    }
});