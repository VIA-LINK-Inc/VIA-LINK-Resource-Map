class MapManager {

    constructor() {
        this.map = null;
        this.markers = [];
        this.visibleMarkers = [];
        this.userLocationMarker = null;
        this.userLocation = null;
        this.nearMeRadiusMiles = null;
        this.markerCluster = null;
        this.activeInfoWindow = null;

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

            this.activeInfoWindow =
    new this.InfoWindow();

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
        markers: this.markers,

       onClusterClick: (event, cluster) => {
    if (!cluster.position) {
        return;
    }

    const currentZoom =
        this.map.getZoom() ??
        CONFIG.map.defaultZoom;

    this.map.panTo(
        cluster.position
    );

    this.map.setZoom(
    Math.min(
        currentZoom + CONFIG.map.clusterZoomStep,
        CONFIG.map.clusterMaxZoom
    )
);
}
    });

        this.fitMapToResources();
    }

    createMarker(resource) {

    const markerStyle =
        this.getMarkerStyle(resource.category);

    let markerGraphic;

    if (markerStyle.type === "warning") {
        markerGraphic =
            this.createWarningMarkerGraphic();
    }
    else {
        const pin = new this.PinElement({
    background: markerStyle.background,
    borderColor: markerStyle.border,
    glyphSrc: this.createSvgIcon(
        this.getMarkerIcon(markerStyle.icon),
        "#ffffff"
    ),
    scale: 1.15
});

        markerGraphic = pin;
    }

    const marker =
        new this.AdvancedMarkerElement({
            position: {
                lat: resource.latitude,
                lng: resource.longitude
            },
            title: resource.name,
            gmpClickable: true
        });

    marker.append(markerGraphic);

    // Keep the resource data attached to its marker.
    marker.resource = resource;

    marker.addEventListener(
        "gmp-click",
        () => {

            this.activeInfoWindow.setContent(
                this.buildInfoWindow(resource)
            );

            this.activeInfoWindow.open({
                anchor: marker,
                map: this.map
            });
        }
    );

    this.markers.push(marker);
}
   focusMarker(marker) {
    this.map.panTo(marker.position);
    this.map.setZoom(
    CONFIG.map.singleResourceZoom
);

    this.activeInfoWindow.setContent(
        this.buildInfoWindow(marker.resource)
    );

    this.activeInfoWindow.open({
        anchor: marker,
        map: this.map
    });
}
createUserLocationMarker(location) {

    if (this.userLocationMarker) {
        this.userLocationMarker.map = null;
    }

    this.userLocation = location;

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

    this.userLocation = null;
    this.nearMeRadiusMiles = null;

    for (const marker of this.markers) {
        delete marker.resource.distanceMiles;
    }

    return this.applyFilters(true);
}
setNearMeRadius(radiusMiles) {

    if (
        radiusMiles === null ||
        radiusMiles === "all"
    ) {
        this.nearMeRadiusMiles = null;
    }
    else {
        const numericRadius =
            Number(radiusMiles);

        this.nearMeRadiusMiles =
            Number.isFinite(numericRadius)
                ? numericRadius
                : null;
    }

    return this.applyFilters(true);
}
getMarkersSortedByDistance(
    location,
    markers = this.markers
) {
    return markers
        .map((marker) => {

            const resourceLocation =
                marker.resource.location ?? {
                    lat:
                        Number(
                            marker.resource.latitude
                        ),
                    lng:
                        Number(
                            marker.resource.longitude
                        )
                };

            const distanceMiles =
                window.locationManager
                    .calculateDistanceMiles(
                        location,
                        resourceLocation
                    );

            marker.resource.location =
                resourceLocation;

            marker.resource.distanceMiles =
                distanceMiles;

            return marker;
        })
        .filter(
            (marker) =>
                Number.isFinite(
                    marker.resource.distanceMiles
                )
        )
        .sort(
            (firstMarker, secondMarker) =>
                firstMarker.resource.distanceMiles -
                secondMarker.resource.distanceMiles
        );
}
createSvgIcon(svgContent, color = "#ffffff") {

    const svg = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="${color}"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
        >
            ${svgContent}
        </svg>
    `;

    return (
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(svg)
    );
}
createWarningMarkerGraphic() {

    const container =
        document.createElement("div");

    container.style.width = "42px";
    container.style.height = "42px";
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";

    container.innerHTML = `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="42"
            height="42"
            viewBox="0 0 48 48"
            aria-hidden="true"
        >
            <path
                d="M24 4L45 42H3L24 4Z"
                fill="#FDD835"
                stroke="#212121"
                stroke-width="3"
                stroke-linejoin="round"
            />

            <line
                x1="24"
                y1="16"
                x2="24"
                y2="29"
                stroke="#212121"
                stroke-width="4"
                stroke-linecap="round"
            />

            <circle
                cx="24"
                cy="35"
                r="2.3"
                fill="#212121"
            />
        </svg>
    `;

    return container;
}
getMarkerIcon(iconName) {

    const icons = {

        food: `
            <path d="M7 2v8M4 2v4c0 2 1 3 3 3s3-1 3-3V2M7 10v12"/>
            <path d="M16 2v20"/>
            <path d="M16 2c3 3 3 7 0 10"/>
        `,

        shelter: `
            <path d="M3 11L12 3l9 8"/>
            <path d="M5 10v11h14V10"/>
            <path d="M9 21v-7h6v7"/>
        `,

        snowflake: `
            <path d="M12 2v20M4.5 6.5l15 11M19.5 6.5l-15 11"/>
        `,

        medical: `
            <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>
        `,

        charging: `
            <path d="M13 2L5 14h6l-1 8 9-13h-6z"/>
        `,

        house: `
            <path d="M3 11L12 3l9 8"/>
            <path d="M5 10v11h14V10"/>
            <path d="M9 21v-7h6v7"/>
        `,

        hammer: `
            <path d="M14 5l5 5"/>
            <path d="M12 7l5 5"/>
            <path d="M3 21l10-10"/>
            <path d="M11 4l3-2 7 7-3 3z"/>
        `,

        plug: `
            <path d="M8 3v6M16 3v6"/>
            <path d="M6 9h12v3a6 6 0 0 1-12 0z"/>
            <path d="M12 18v4"/>
        `,

        repairHouse: `
            <path d="M3 11L12 3l9 8"/>
            <path d="M5 10v11h14V10"/>
            <path d="M15 14l4 4"/>
            <path d="M14 19l5-5"/>
        `,

        heart: `
            <path d="M12 21S4 16 4 9a4 4 0 0 1 7-2.5A4 4 0 0 1 18 9c0 7-6 12-6 12z"/>
        `,

        shield: `
            <path d="M12 2l8 3v6c0 5-3 9-8 11-5-2-8-6-8-11V5z"/>
            <path d="M8 12l3 3 5-6"/>
        `,

        default: `
            <circle cx="12" cy="12" r="3"/>
        `
    };

    return icons[iconName] ?? icons.default;
}
           getMarkerStyle(category) {

    const configuredStyle =
        CONFIG.resourceCategories?.styles?.[category];

    const defaultStyle =
        CONFIG.resourceCategories?.defaultStyle ?? {
            background: "#757575",
            border: "#424242",
            icon: "default"
        };

    return configuredStyle ?? defaultStyle;
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
            resource.parish,
            resource.description,
            resource.hours,
            resource.phone,
            resource.email,
            resource.website
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            this.searchQuery === "" ||
            searchableText.includes(this.searchQuery);

        let matchesNearMe = true;

        if (this.userLocation) {
            const resourceLocation =
                resource.location ?? {
                    lat: Number(resource.latitude),
                    lng: Number(resource.longitude)
                };

            const distanceMiles =
                window.locationManager.calculateDistanceMiles(
                    this.userLocation,
                    resourceLocation
                );

            resource.location = resourceLocation;
            resource.distanceMiles = distanceMiles;

            if (this.nearMeRadiusMiles !== null) {
                matchesNearMe =
                    distanceMiles <= this.nearMeRadiusMiles;
            }
        }

        if (
            matchesCategory &&
            matchesSearch &&
            matchesNearMe
        ) {
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
    else if (
        shouldFit &&
        visibleMarkers.length > 1
    ) {
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

        this.map.setZoom(13);
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

}

fitMapToResources() {
    this.fitMapToMarkers(this.markers);
}
}
window.mapManager = new MapManager();