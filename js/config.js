// ====================================================================
// VIA LINK Disaster Resource Map
// Application Configuration
// ====================================================================

// Central location for application settings.
// When we move from the demo API key to the production key,
// this is the only file we'll need to update.

const CONFIG = {

    // Google Maps API Key
    googleMaps: {apiKey: "KEY_HERE"},
googleSheets: {
    spreadsheetId: "SPREADSHEET_ID_HERE",

    resourceSheets: [
        {
            sheetName: "Food",
            category: "Food"
        },
        {
            sheetName: "Shelter",
            category: "Shelter"
        },
        {
            sheetName: "Medical",
            category: "Medical"
        },
        {
            sheetName: "Charging",
            category: "Charging"
        }
    ],

    range: "A1:Z"
},
   // Default map center (New Orleans)
   map: {
    defaultCenter: {
        lat: 29.9511,
        lng: -90.0715
},

// Initial zoom level
defaultZoom: 11,

mapId: "DEMO_MAP_ID"
   }

};