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

export const CONTEXTS_MAP = new Map([
['fdc3.contact', { context: contact, intent: 'StartCall' }],
    ['fdc3.instrument', { context: instrument, intent: 'ViewChart' }]
]);

export const INTENT_CONTEXT_MAP = new Map();
INTENT_CONTEXT_MAP.set('ViewChart', instrument);
INTENT_CONTEXT_MAP.set('ViewNews', instrument);
INTENT_CONTEXT_MAP.set('StartCall', contact);