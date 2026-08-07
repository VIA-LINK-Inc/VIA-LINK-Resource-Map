class LocationManager {

    async getCurrentLocation() {

        if (!navigator.geolocation) {
            throw new Error(
                "Geolocation is not supported by this browser."
            );
        }

        return new Promise((resolve, reject) => {

            navigator.geolocation.getCurrentPosition(
                (position) => {

                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });

                },
                (error) => {
                    reject(error);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000
                }
            );

        });
    } calculateDistanceMiles(startLocation, endLocation) {
        const earthRadiusMiles = 3958.8;

        const toRadians = (degrees) =>
            degrees * (Math.PI / 180);

        const startLatitude =
            toRadians(startLocation.lat);

        const endLatitude =
            toRadians(endLocation.lat);

        const latitudeDifference =
            toRadians(
                endLocation.lat - startLocation.lat
            );

        const longitudeDifference =
            toRadians(
                endLocation.lng - startLocation.lng
            );

        const haversineValue =
            Math.sin(latitudeDifference / 2) ** 2 +
            Math.cos(startLatitude) *
            Math.cos(endLatitude) *
            Math.sin(longitudeDifference / 2) ** 2;

        const angularDistance =
            2 * Math.atan2(
                Math.sqrt(haversineValue),
                Math.sqrt(1 - haversineValue)
            );

        return earthRadiusMiles * angularDistance;
    }

}

window.locationManager = new LocationManager();