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