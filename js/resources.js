class ResourceManager {

    constructor() {
        this.resources = [];
    }

    async loadResources() {

        console.log("Loading resources...");

        const response = await fetch("data/resources.json");

        if (!response.ok) {
            throw new Error(
                `Unable to load resources. HTTP status: ${response.status}`
            );
        }

        this.resources = await response.json();

        console.log(`${this.resources.length} resources loaded.`);

        return this.resources;
    }
}

window.resourceManager = new ResourceManager();