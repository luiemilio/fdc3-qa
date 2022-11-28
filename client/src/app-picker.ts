import * as OpenFin from "@openfin/core/src/OpenFin";
declare const fin: OpenFin.Fin<"window" | "view">;

const setupListeners = (appSelectDropDown, client) => {
    const okBtn: HTMLButtonElement = document.querySelector('#picker-okay-button');

    okBtn.onclick = async () => {
        client.dispatch('target-app', JSON.parse(appSelectDropDown.value));
        fin.Window.getCurrentSync().close();
    }
}

const populate = (apps, appSelectDropDown) => {
    apps.forEach(app => {
        const newApp = new Option(app.endpointId, JSON.stringify(app));
        appSelectDropDown.add(newApp);
    });
}

const setup = async () => {
    const appSelectDropDown: HTMLSelectElement = document.querySelector('#app-select');
    const params = new URLSearchParams(window.location.search);
    const providerName = params.get('provider');    
    const apps = JSON.parse(params.get('apps')).apps;
    const client = await fin.InterApplicationBus.Channel.connect(providerName);
    
    setupListeners(appSelectDropDown, client);
    populate(apps, appSelectDropDown);
}

await setup();



