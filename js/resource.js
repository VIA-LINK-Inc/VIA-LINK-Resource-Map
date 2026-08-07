class Resource {

    constructor(data) {
    this.id = data.id ?? null;
    this.name = String(data.name ?? "").trim();
    this.category = String(data.category ?? "Other").trim();
    this.address = String(data.address ?? "").trim();

    this.latitude = Number(data.latitude);
    this.longitude = Number(data.longitude);

    this.phone = String(data.phone ?? "").trim();
    this.email = String(data.email ?? "").trim();
    this.website = String(data.website ?? "").trim();
    this.hours = String(data.hours ?? "").trim();
    this.notes = String(data.notes ?? "").trim();
    this.languages = String(data.languages ?? "").trim();
    this.lastUpdated =
        String(data.lastUpdated ?? "").trim();

    this.adaAccessible =
        Boolean(data.adaAccessible);

    this.petFriendly =
        Boolean(data.petFriendly);
}

    /**
     * Confirms that the minimum information needed for a map marker exists.
     */
    isValid() {
        return (
            this.name.length > 0 &&
            Number.isFinite(this.latitude) &&
            Number.isFinite(this.longitude)
        );
    }

    /**
     * Produces a Google Maps directions URL for this resource.
     */
    getDirectionsUrl() {
        const destination = encodeURIComponent(
            `${this.latitude},${this.longitude}`
        );

        return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
    }

    /**
     * Produces a telephone link suitable for mobile devices.
     */
    getPhoneUrl() {
        const normalizedPhone = this.phone.replace(/[^\d+]/g, "");

        return normalizedPhone ? `tel:${normalizedPhone}` : "";
    }
}

window.Resource = Resource;