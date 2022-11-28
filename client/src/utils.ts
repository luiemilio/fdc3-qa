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

export const EXAMPLE_APP_METADATA = {

}

export const EXAMPLE_CONTEXTS_MAP = new Map();
EXAMPLE_CONTEXTS_MAP.set('fdc3.contact', { context: contact, intent: 'StartCall' });
EXAMPLE_CONTEXTS_MAP.set('fdc3.instrument', { context: instrument, intent: 'ViewChart' });

export const INTENT_CONTEXT_MAP = new Map();
INTENT_CONTEXT_MAP.set('ViewChart', instrument);
INTENT_CONTEXT_MAP.set('ViewNews', instrument);
INTENT_CONTEXT_MAP.set('StartCall', contact);