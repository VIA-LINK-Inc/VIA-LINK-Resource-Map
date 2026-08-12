// ====================================================================
// VIA LINK Disaster Resource Map
// Application Configuration
// ====================================================================

// Central location for application settings.

const CONFIG = {

    // Google Maps configuration
    googleMaps: {
        apiKey: "AIzaSyAClbVNIqRwa7Yy1kbjU9LIHbgWEp_oV_0"
    },

    // Google Sheets configuration
    googleSheets: {
        spreadsheetId: "1JrqGYulk1h3Kzx_IWyphtj6eJQoanyf7shY5t0XJ6J8"
    },

    demo: {
        enabled: false 
    },

    // Map configuration
    map: {

        // Default map center: New Orleans
        defaultCenter: {
            lat: 29.9511,
            lng: -90.0715
        },

        // Initial zoom level
        defaultZoom: 11,

        // Google Maps Map ID
        mapId: "YOUR_MAP_ID"
    }
};