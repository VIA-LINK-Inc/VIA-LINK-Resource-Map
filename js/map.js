class MapManager {

    constructor() {
        this.map = null;
        this.markers = [];
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

        const resources = window.resourceManager.loadTestData();

        for (const resource of resources) {
            this.createMarker(resource);
        }

        this.fitMapToResources();
    }

    createMarker(resource) {

        const marker = new google.maps.Marker({
            position: {
                lat: resource.latitude,
                lng: resource.longitude
            },
            map: this.map,
            title: resource.name
        });

        const infoWindow = new google.maps.InfoWindow({
            content: this.buildInfoWindow(resource)
        });

        marker.addListener("click", () => {
            infoWindow.open({
                anchor: marker,
                map: this.map
            });
        });

        this.markers.push(marker);
    }

    buildInfoWindow(resource) {

        return `
            <div style="max-width:260px;">

                <h2 style="margin-bottom:8px;">
                    ${resource.name}
                </h2>

                <p>
                    <strong>Category:</strong>
                    ${resource.category}
                </p>

                <p>
                    <strong>Address:</strong><br>
                    ${resource.address}
                </p>

                <p>
                    <strong>Hours:</strong><br>
                    ${resource.hours}
                </p>

                <p>
                    <strong>Phone:</strong><br>
                    ${resource.phone}
                </p>

                <hr>

                <p>
                    <a href="${resource.website}" target="_blank">
                        Visit Website
                    </a>
                </p>

            </div>
        `;
    }

    fitMapToResources() {

        if (this.markers.length === 0) {
            return;
        }

        if (this.markers.length === 1) {
            this.map.setCenter(this.markers[0].getPosition());
            this.map.setZoom(CONFIG.map.defaultZoom);
            return;
        }

        const bounds = new google.maps.LatLngBounds();

        for (const marker of this.markers) {
            bounds.extend(marker.getPosition());
        }

        this.map.fitBounds(bounds);
    }

}

window.mapManager = new MapManager();