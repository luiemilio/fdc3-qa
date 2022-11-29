import * as OpenFin from "@openfin/core/src/OpenFin";

declare const fin: OpenFin.Fin<"window" | "view">;

export const APP_DIRECTORY = [
    { 
        appId: 'fdc3-client-one',
        name: 'fdc3-client-one',
        title: 'FDC3 QA - Client App',
        description: 'Client to test FDC3 functionality',
        version: '1.0',
        url: 'http://localhost:5050/html/fdc3-client.html?client=1'
    },
    { 
        appId: 'fdc3-client-two',
        name: 'fdc3-client-two',
        title: 'FDC3 QA - Client App 2',
        description: 'Second app just to test launching more than one app',
        version: '1.5',
        url: 'http://localhost:5050/html/fdc3-client.html?client=2'
    },
]

export const getAppDirectory = async () => {
    const appDirectoryURL = 'https://directory.fdc3.finos.org/v2/apps/';
    const response = await fetch(appDirectoryURL);
    const json = await response.json();
    return json.applications;
}

const contact = {
    type: "fdc3.contact",
    name: "Jane Doe",
    id: {
        email: "jane.doe@mail.com"
    }
}

const instrument = {
    type: "fdc3.instrument",
    name: "Microsoft",
    id: {
        ticker: "MSFT",
        RIC: "MSFT.OQ",
        ISIN: "US5949181045"
    },
    market: {
        MIC: "XNAS"
    }
}

export const INTENTS_METADATA_MAP = new Map([
    ['ViewChart', { name: 'ViewChart', displayName: 'Start a Chat' }],
    ['ViewNews', { name: 'ViewNews', displayName: 'View News' }],
    ['StartCall', { name: 'StartCall', displayName: 'Start a Call' }],
]);

export const EXAMPLE_CONTEXTS_MAP = new Map([
['fdc3.contact', { context: contact, intent: 'StartCall' }],
    ['fdc3.instrument', { context: instrument, intent: 'ViewChart' }]
]);

export const INTENT_CONTEXT_MAP = new Map();
INTENT_CONTEXT_MAP.set('ViewChart', instrument);
INTENT_CONTEXT_MAP.set('ViewNews', instrument);
INTENT_CONTEXT_MAP.set('StartCall', contact);


export const showPicker = async (modalParentIdentity, type, payload?): Promise<OpenFin.ClientInfo | string | void> => {
    const pickerName = `picker-${modalParentIdentity.name}-${modalParentIdentity.uuid}`;
    const providerName = `${pickerName}-provider`;
    const queryString = new URLSearchParams(`provider=${providerName}&type=${type}`);
    
    if (type === 'app' && payload) {
        const { allClientInfo } = payload;
        const onlyViews = allClientInfo.filter(client => client.entityType === 'view');
        queryString.set('apps', JSON.stringify({ apps: onlyViews }));
    }

    const url = `http://localhost:5050/html/picker.html?${queryString.toString()}`;
    const appPicker = fin.Window.wrapSync({ uuid: fin.me.identity.uuid, name: pickerName });
    const provider = await fin.InterApplicationBus.Channel.create(providerName);

    return new Promise(async (resolve, reject) => {
        appPicker.once('closed', async () => {
            await provider.destroy();
            resolve();
        });

        provider.register('picker-result', (result: any) => {
            console.log('##### picker result', result);
            resolve(result);
        });

        await fin.Window.create({
            name: pickerName,
            url,
            modalParentIdentity,
            frame: true,
            defaultHeight: 240,
            defaultWidth: 400,
            saveWindowState: false,
            defaultCentered: true,
            maximizable: false,
            minimizable: false,
            resizable: false
        });
    });
}