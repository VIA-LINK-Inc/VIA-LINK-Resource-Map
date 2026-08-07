class ResultCardBuilder {

    build(marker) {

        const card = document.createElement("div");

        card.className = "resource-result";

        card.innerHTML = `
    <p class="resource-result__category">
        ${marker.resource.category || "Resource"}
    </p>

    <h4>${marker.resource.name}</h4>

    ${
        Number.isFinite(marker.resource.distanceMiles)
            ? `<p class="resource-result__distance">
                   ${marker.resource.distanceMiles.toFixed(1)} mi away
               </p>`
            : ""
    }

    ${
        marker.resource.address
            ? `<p>${marker.resource.address}</p>`
            : ""
    }

    ${
        marker.resource.phone
            ? `<p>${marker.resource.phone}</p>`
            : ""
    }
`;

        card.addEventListener("click", () => {
            window.mapManager.focusMarker(marker);
        });

        return card;
    }
}

window.resultCardBuilder = new ResultCardBuilder();