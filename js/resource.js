// Turns a spreadsheet cell into a coordinate.
// A blank cell becomes "not a number" instead of 0.
function parseCoordinate(value) {
    const text = String(value ?? "").trim();
    return text === "" ? NaN : Number(text);
}

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
            parseCoordinate(data.latitude);

        this.longitude =
            parseCoordinate(data.longitude);

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
            Number.isFinite(this.longitude) &&
            Math.abs(this.latitude) <= 90 &&
            Math.abs(this.longitude) <= 180 &&
            !(this.latitude === 0 && this.longitude === 0)
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