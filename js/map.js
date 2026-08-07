class MapManager {

    constructor() {
        this.map = null;
        this.markers = [];
        this.visibleMarkers = [];
        this.userLocationMarker = null;
        this.markerCluster = null;

        this.activeCategory = "All";
        this.searchQuery = "";
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
        this.visibleMarkers = [...this.markers];

        this.markerCluster =
            new markerClusterer.MarkerClusterer({
             map: this.map,
             markers: this.markers
    });
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
    focusMarker(marker) {
    this.map.panTo(marker.position);
    this.map.setZoom(14);

    const infoWindow = new this.InfoWindow({
        content: this.buildInfoWindow(marker.resource)
    });

    infoWindow.open({
        anchor: marker,
        map: this.map
    });
}
createUserLocationMarker(location) {

    if (this.userLocationMarker) {
        this.userLocationMarker.map = null;
    }

    const pin = new this.PinElement({
    background: "#1a73e8",
    borderColor: "#0b57d0",
    glyphColor: "#ffffff",
    glyphText: "●",
    scale: 1.2
});

this.userLocationMarker =
    new this.AdvancedMarkerElement({
        position: location,
        map: this.map,
        title: "Your Location"
    });

this.userLocationMarker.append(pin);

    this.map.panTo(location);
}

clearUserLocation() {
    if (this.userLocationMarker) {
        this.userLocationMarker.map = null;
        this.userLocationMarker = null;
    }

    for (const marker of this.markers) {
        delete marker.resource.distanceMiles;
    }
}

getMarkersSortedByDistance(location) {
    return this.markers
        .map((marker) => {
            const resourceLocation =
                marker.resource.location ?? {
                    lat: Number(marker.resource.latitude),
                    lng: Number(marker.resource.longitude)
                };

            const distanceMiles =
                window.locationManager.calculateDistanceMiles(
                    location,
                    resourceLocation
                );

            marker.resource.location = resourceLocation;
            marker.resource.distanceMiles = distanceMiles;

            return marker;
        })
        .filter((marker) =>
            Number.isFinite(marker.resource.distanceMiles)
        )
        .sort(
            (firstMarker, secondMarker) =>
                firstMarker.resource.distanceMiles -
                secondMarker.resource.distanceMiles
        );
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
    return window.infoWindowBuilder.build(resource);
}

    filterMarkers(category) {
    this.activeCategory = category;

    const visibleMarkers = this.applyFilters(true);

    return visibleMarkers.length;
}

searchMarkers(query, shouldFit = false) {
    this.searchQuery =
        String(query ?? "")
            .trim()
            .toLowerCase();

    return this.applyFilters(shouldFit);
}

zoomToFilteredMarkers() {
    this.fitMapToMarkers(
        this.visibleMarkers
    );
}

applyFilters(shouldFit = true) {
    const visibleMarkers = [];

    for (const marker of this.markers) {
        const resource = marker.resource;

        const matchesCategory =
            this.activeCategory === "All" ||
            resource.category === this.activeCategory;

        const searchableText = [
            resource.name,
            resource.category,
            resource.address,
            resource.phone,
            resource.email,
            resource.website,
            resource.hours,
            resource.notes,
            resource.languages
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            this.searchQuery === "" ||
            searchableText.includes(this.searchQuery);

        if (matchesCategory && matchesSearch) {
            visibleMarkers.push(marker);
        }
    }

    this.visibleMarkers = visibleMarkers;

    if (this.markerCluster) {
        this.markerCluster.clearMarkers();

        this.markerCluster.addMarkers(
            visibleMarkers
        );
    }

    if (visibleMarkers.length === 1) {
        this.fitMapToMarkers(visibleMarkers);
    }
    else if (shouldFit && visibleMarkers.length > 1) {
        this.fitMapToMarkers(visibleMarkers);
    }

    return visibleMarkers;
}

fitMapToMarkers(markers) {
    if (markers.length === 0) {
        return;
    }

    if (markers.length === 1) {
        const resource = markers[0].resource;

        this.map.setCenter({
            lat: resource.latitude,
            lng: resource.longitude
        });

        this.map.setZoom(14);
        return;
    }

    const bounds = new this.LatLngBounds();

    for (const marker of markers) {
        bounds.extend({
            lat: marker.resource.latitude,
            lng: marker.resource.longitude
        });
    }

    this.map.fitBounds(bounds, 60);

    google.maps.event.addListenerOnce(
        this.map,
        "idle",
        () => {
            const currentZoom = this.map.getZoom();

            if (currentZoom < CONFIG.map.defaultZoom) {
                this.map.setZoom(CONFIG.map.defaultZoom);
            }
        }
    );
}

fitMapToResources() {
    this.fitMapToMarkers(this.markers);
}
}
window.mapManager = new MapManager();