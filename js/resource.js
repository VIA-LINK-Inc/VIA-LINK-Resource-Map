class Resource {

    constructor(data) {
        this.id = data.id ?? null;

        this.name =
            String(data.name ?? "").trim();

        this.category =
            String(data.category ?? "Other").trim();

        this.address =
            String(data.address ?? "").trim();

        this.latitude =
            Number(data.latitude);

        this.longitude =
            Number(data.longitude);

        this.parish =
            String(data.parish ?? "").trim();

        this.description =
            String(data.description ?? "").trim();

        this.hours =
            String(data.hours ?? "").trim();

        this.phone =
            String(data.phone ?? "").trim();

        this.email =
            String(data.email ?? "").trim();

        this.website =
            String(data.website ?? "").trim();

        this.active =
            Boolean(data.active);

        this.location = {
            lat: this.latitude,
            lng: this.longitude
        };
    }

    /**
     * Confirms that the minimum information needed
     * for a map marker exists.
     */
    isValid() {
        return (
            this.name.length > 0 &&
            Number.isFinite(this.latitude) &&
            Number.isFinite(this.longitude)
        );
    }

    /**
     * Produces a Google Maps directions URL.
     *
     * Whether the Directions button is displayed
     * will later be controlled by whether Address exists.
     */
    getDirectionsUrl() {
        const destination = encodeURIComponent(
            `${this.latitude},${this.longitude}`
        );

        return (
            "https://www.google.com/maps/dir/" +
            `?api=1&destination=${destination}`
        );
    }

    /**
     * Produces a telephone link suitable
     * for mobile devices.
     */
    getPhoneUrl() {
        const normalizedPhone =
            this.phone.replace(/[^\d+]/g, "");

        return normalizedPhone
            ? `tel:${normalizedPhone}`
            : "";
    }
}

window.Resource = Resource;