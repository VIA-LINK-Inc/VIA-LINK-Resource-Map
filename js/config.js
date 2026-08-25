// ====================================================================
// VIA LINK Disaster Resource Map
// Application Configuration
// ====================================================================

// Central location for application settings.

const CONFIG = {

    client: {
    name: "VIA LINK",
    mapTitle: "VIA LINK Disaster Resource Map",
    demoMapTitle: "DEMO - VIA LINK Disaster Resource Map",
    brandColor: "#087DC1"
},

    // Google Maps configuration
    googleMaps: {
        apiKey: "AIzaSyAjjm24_xUxakT0zeyROPIK_AZv1qYfuqY"
    },

    // Google Sheets configuration
    googleSheets: {
        spreadsheetId: "1JrqGYulk1h3Kzx_IWyphtj6eJQoanyf7shY5t0XJ6J8"
    },

    demo: {
    enabled: true,

    title: "This is a Demo Version",

    message: "This resource map is a demo version of the tool that VIA LINK deploys during disasters. The information displayed here is sample data and does not represent actual resources.",

    buttonText: "I Understand"
},

resourceCategories: {
    order: [
    "Food Sites",
    "Shelters",
    "Cooling Station",
    "Medical Supplies",
    "Boil Advisory",
    "Utility Assistance",
    "Temporary Housing",
    "Restore Louisiana",
    "Rebuilding Support",
    "FEMA",
    "Emotional Support"
],
    styles: {
        "Food Sites": {
            background: "#2e7d32",
            border: "#1b5e20",
            icon: "food"
        },

        "Shelters": {
            background: "#1976d2",
            border: "#0d47a1",
            icon: "shelter"
        },

        "Cooling Station": {
            background: "#039be5",
            border: "#0277bd",
            icon: "snowflake"
        },

        "Medical Supplies": {
            background: "#d32f2f",
            border: "#8b0000",
            icon: "medical"
        },

        "Charging": {
            background: "#f57c00",
            border: "#e65100",
            icon: "charging"
        },

        "Temporary Housing": {
            background: "#00897b",
            border: "#00695c",
            icon: "house"
        },

        "Rebuilding Support": {
            background: "#ef6c00",
            border: "#bf360c",
            icon: "hammer"
        },

        "Utility Assistance": {
            background: "#7b1fa2",
            border: "#4a148c",
            icon: "plug"
        },

        "Restore Louisiana": {
            background: "#1565c0",
            border: "#0d47a1",
            icon: "repairHouse"
        },

        "Emotional Support": {
            background: "#c2185b",
            border: "#880e4f",
            icon: "heart"
        },

        "FEMA": {
            background: "#455a64",
            border: "#263238",
            icon: "shield"
        },

        "Boil Advisory": {
            type: "warning"
        }
    },

    defaultStyle: {
        background: "#757575",
        border: "#424242",
        icon: "default"
    }
},

    // Map configuration
    map: {
        clusterZoomStep: 2,
clusterMaxZoom: 16,
singleResourceZoom: 13,

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