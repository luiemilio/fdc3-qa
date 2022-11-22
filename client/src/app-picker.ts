import * as OpenFin from "@openfin/core/src/OpenFin";
declare const fin: OpenFin.Fin<"window" | "view">;

const populate = () => {
    const params = new URLSearchParams(window.location.search)
    const apps = JSON.parse(params.get('apps')).apps;
    const appSelectDropDown: HTMLSelectElement = document.querySelector('#app-select');

    apps.forEach(app => {
        const newApp = new Option(app.name, JSON.stringify(app));
        appSelectDropDown.add(newApp);
    });
}

populate();

