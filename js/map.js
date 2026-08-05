class MapManager {

    constructor() {
        this.map = null;
        this.markers = [];

        // These Google Maps classes will be loaded during initialization.
        this.AdvancedMarkerElement = null;
        this.PinElement = null;
        this.InfoWindow = null;
        this.LatLngBounds = null;
    }

    async initialize() {

        console.log("Initializing Google Map...");

        // Load only the Google Maps libraries this application needs.
        const mapsLibrary =
    await google.maps.importLibrary("maps");

const markerLibrary =
    await google.maps.importLibrary("marker");

const coreLibrary =
    await google.maps.importLibrary("core");

        this.AdvancedMarkerElement =
            markerLibrary.AdvancedMarkerElement;

        this.PinElement =
            markerLibrary.PinElement;

        this.InfoWindow =
            mapsLibrary.InfoWindow;

        this.LatLngBounds =
            coreLibrary.LatLngBounds;

        this.map = new mapsLibrary.Map(
            document.getElementById("map"),
            {
                center: CONFIG.map.defaultCenter,
                zoom: CONFIG.map.defaultZoom,
                mapId: CONFIG.map.mapId,

                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: true,
                zoomControl: true,
                scaleControl: true,
                gestureHandling: "greedy",
                clickableIcons: false
            }
        );

        const resources =
            await window.resourceManager.loadResources();

        for (const resource of resources) {
            this.createMarker(resource);
        }

        this.fitMapToResources();
    }

    createMarker(resource) {

        const pinColors =
            this.getMarkerColors(resource.category);

        const pin = new this.PinElement({
            background: pinColors.background,
            borderColor: pinColors.border,
            glyphColor: "#ffffff",
            scale: 1.05
        });

        const marker = new this.AdvancedMarkerElement({
    position: {
        lat: resource.latitude,
        lng: resource.longitude
    },
    map: this.map,
    title: resource.name,
    gmpClickable: true
});

        // Add the colored pin graphic to the advanced marker.
        marker.append(pin);

        // Keep the resource data attached to its marker.
        marker.resource = resource;

        const infoWindow = new this.InfoWindow({
            content: this.buildInfoWindow(resource)
        });

        marker.addEventListener("gmp-click", () => {
    infoWindow.open({
        anchor: marker,
        map: this.map
    });
});

        this.markers.push(marker);
    }

    getMarkerColors(category) {

        const categoryColors = {
            Shelter: {
                background: "#1976d2",
                border: "#0d47a1"
            },

            Food: {
                background: "#2e7d32",
                border: "#1b5e20"
            },

            Medical: {
                background: "#d32f2f",
                border: "#8b0000"
            },

            Charging: {
                background: "#f9a825",
                border: "#b26a00"
            }
        };

        return categoryColors[category] || {
            background: "#7b1fa2",
            border: "#4a0072"
        };
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
                    <a
                        href="${resource.website}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Visit Website
                    </a>
                </p>

            </div>
        `;
    }

    filterMarkers(category) {

        for (const marker of this.markers) {

            const shouldShow =
                category === "All" ||
                marker.resource.category === category;

            // Advanced markers use the map property instead of setMap().
            marker.map = shouldShow ? this.map : null;
        }
    }

    fitMapToResources() {

        if (this.markers.length === 0) {
            return;
        }

        if (this.markers.length === 1) {

            const resource = this.markers[0].resource;

            this.map.setCenter({
                lat: resource.latitude,
                lng: resource.longitude
            });

            this.map.setZoom(CONFIG.map.defaultZoom);

            return;
        }

        const bounds = new this.LatLngBounds();

        for (const marker of this.markers) {

            bounds.extend({
                lat: marker.resource.latitude,
                lng: marker.resource.longitude
            });
        }

        this.map.fitBounds(bounds);
    }

}

window.mapManager = new MapManager();