class MapManager {

    constructor() {
        this.map = null;
    }

    async initialize() {

    console.log("Initializing Google Map...");

    this.map = new google.maps.Map(
        document.getElementById("map"),
        {
            center: CONFIG.map.defaultCenter,
            zoom: CONFIG.map.defaultZoom,

            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            scaleControl: true,

            gestureHandling: "greedy",

            clickableIcons: false
        }
    );
    const marker = new google.maps.Marker({
    position: {
        lat: 29.9511,
        lng: -90.0715
    },
    map: this.map,
    title: "VIA LINK Test Location"
});
const infoWindow = new google.maps.InfoWindow({
    content: `
        <div>
            <h3>VIA LINK Test Location</h3>
            <p>This is our first test marker.</p>
        </div>
    `
});

marker.addListener("click", () => {
    infoWindow.open({
        anchor: marker,
        map: this.map
    });
});
}
}
window.mapManager = new MapManager();