import * as OpenFin from "@openfin/core/src/OpenFin";

declare const fin: OpenFin.Fin<"window" | "view">;

const setupListeners = (client, type) => {
    const okBtn: HTMLButtonElement = document.querySelector('#picker-okay-button');

    okBtn.onclick = async () => {
        const selectDropDown: HTMLSelectElement = document.querySelector('#picker-select');
        const result = type === 'app' ? JSON.parse(selectDropDown.value) : selectDropDown.value;
        await client.dispatch('picker-result', result);
        fin.Window.getCurrentSync().close();
    }
}

const populate = (items, type) => {
    const selectDropDown: HTMLSelectElement = document.querySelector('#picker-select');

    items.forEach((item, idx) => {
        let text;
        let value;

        if (type === 'app') {
            const { name } = item;
            text = name;
            value = JSON.stringify(item);
        }

        if (type === 'fdc3') {
            text = item;
            value = item;
        }

        const option = idx === 0 ? new Option(text, value, true) : new Option(text, value);

        selectDropDown.add(option);
    });
}

const setup = async () => {
    const header = document.querySelector('#picker-header');
    const params = new URLSearchParams(window.location.search);
    const pickerType = params.get('type');
    const providerName = params.get('provider');    
    const client = await fin.InterApplicationBus.Channel.connect(providerName);
    let items;

    if (pickerType === 'app') {
        header.innerHTML = 'Pick an app to handle the intent'
        items = JSON.parse(params.get('apps')).apps;
    }

    if (pickerType === 'fdc3') {
        header.innerHTML = 'Pick FDC3 version';
        items = ['1.2', '2.0'];
    }

    setupListeners(client, pickerType);
    populate(items, pickerType);
}

await setup();



