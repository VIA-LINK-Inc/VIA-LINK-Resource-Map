class InfoWindowBuilder {

    /**
     * Prevents spreadsheet or JSON values from being interpreted as HTML.
     */
    escapeHtml(value) {
        const element = document.createElement("div");

        element.textContent = value ?? "";

        return element.innerHTML;
    }

    /**
     * Only permits normal web addresses.
     */
    getSafeWebsiteUrl(website) {
        if (!website) {
            return "";
        }

        try {
            const url = new URL(website);

            if (url.protocol === "https:" || url.protocol === "http:") {
                return url.href;
            }
        } catch (error) {
            console.warn("Invalid resource website:", website);
        }

        return "";
    }

    build(resource) {
        const name = this.escapeHtml(resource.name);
        const category = this.escapeHtml(resource.category);
        const address = this.escapeHtml(resource.address);
        const hours = this.escapeHtml(resource.hours);
        const phone = this.escapeHtml(resource.phone);

        const websiteUrl = this.getSafeWebsiteUrl(resource.website);
        const directionsUrl = resource.getDirectionsUrl();
        const phoneUrl = resource.getPhoneUrl();

        return `
            <article class="resource-popup">
                <h2 class="resource-popup__title">${name}</h2>

                <p class="resource-popup__category">${category}</p>

                ${
                    address
                        ? `
                            <p>
                                <strong>Address</strong><br>
                                ${address}
                            </p>
                        `
                        : ""
                }

                ${
                    hours
                        ? `
                            <p>
                                <strong>Hours</strong><br>
                                ${hours}
                            </p>
                        `
                        : ""
                }

                ${
                    phone
                        ? `
                            <p>
                                <strong>Phone</strong><br>
                                ${phone}
                            </p>
                        `
                        : ""
                }

                <div class="resource-popup__actions">
                    <a
                        href="${directionsUrl}"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Directions
                    </a>

                    ${
                        phoneUrl
                            ? `<a href="${phoneUrl}">Call</a>`
                            : ""
                    }

                    ${
                        websiteUrl
                            ? `
                                <a
                                    href="${websiteUrl}"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Website
                                </a>
                            `
                            : ""
                    }
                </div>
            </article>
        `;
    }
}

window.infoWindowBuilder = new InfoWindowBuilder();