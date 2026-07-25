document.addEventListener("DOMContentLoaded", async () => {
    console.log("Application starting...");

    await window.mapManager.initialize();

    console.log("Application ready.");
});