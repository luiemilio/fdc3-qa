import * as OpenFin from "@openfin/core/src/OpenFin";
import type { DesktopAgent, Listener } from '@openfin/core/src/api/interop/fdc3/shapes/fdc3v2';
import { EXAMPLE_CONTEXTS_MAP, INTENT_CONTEXT_MAP, getAppDirectory } from './constants';

declare const fin: OpenFin.Fin<"window" | "view">;
declare const fdc3: DesktopAgent;

const setTextArea = (message) => {
    const resultTextArea: HTMLTextAreaElement = document.querySelector('#result-textarea');
    resultTextArea.value = message;
};

const setupListeners = async () => {
    const appDirectory = await getAppDirectory();
    const selectBroadcastContext: HTMLSelectElement = document.querySelector('#select-broadcast-context');
    const selectRaiseIntent: HTMLSelectElement = document.querySelector('#select-intent-to-raise');
    const selectIntentForContext: HTMLSelectElement = document.querySelector('#select-intent-to-raise-for-context');
    const selectIntent: HTMLSelectElement = document.querySelector('#select-intent');
    const getInfoBtn: HTMLButtonElement = document.querySelector('#get-info');
    const selectAppMetadata: HTMLSelectElement = document.querySelector('#select-app-metadata');
    const selectOpen: HTMLSelectElement = document.querySelector('#select-open');

    let intentListener: Listener;

    INTENT_CONTEXT_MAP.forEach((context, intent) => {
        selectIntent.add(new Option(intent, intent));
        selectRaiseIntent.add(new Option(intent, intent));
    });

    EXAMPLE_CONTEXTS_MAP.forEach((contextTypeInfo, contextType) => {
        selectBroadcastContext.add(new Option(contextType, contextType));
        selectIntentForContext.add(new Option(contextType, contextType));
    });

    appDirectory.forEach(appInfo => {
        selectOpen.add(new Option(appInfo.appId, appInfo.appId));
        selectAppMetadata.add(new Option(appInfo.appId, appInfo.appId));
    });

    selectIntent.onchange = async () => {
        const intent = selectIntent.value;

        const intentHandler = (context, contextMetadata) => {
            setTextArea(`Handled ${intent} intent with the following context and metadata:\ncontext: ${JSON.stringify(context, null, 2)}\ncontextMetadata: ${JSON.stringify(contextMetadata, null, 2)}`);
        }

        if (intentListener) {
            await intentListener.unsubscribe();
        }

        intentListener = await fdc3.addIntentListener(selectIntent.value, intentHandler);   
    }

    await fdc3.addContextListener(null, (context, contextMetadata) => {
        setTextArea(`context: ${JSON.stringify(context, null, 2)}\ncontextMetadata: ${JSON.stringify(contextMetadata, null, 2)}`);
    });



    selectBroadcastContext.onchange = async () => {
        const selectedContextType = selectBroadcastContext.value;
        await fdc3.broadcast(EXAMPLE_CONTEXTS_MAP.get(selectedContextType).context);
        selectBroadcastContext.options[0].selected = true;
    };

    selectRaiseIntent.onchange = async () => {
        const selectedIntent = selectRaiseIntent.value;

        if (selectedIntent !== '') {
            await fdc3.raiseIntent(selectedIntent, INTENT_CONTEXT_MAP.get(selectedIntent));
        }

        selectRaiseIntent.options[0].selected = true;
    }

    selectIntentForContext.onchange = async () => {
        const intentResolution = await fdc3.raiseIntentForContext(EXAMPLE_CONTEXTS_MAP.get(selectIntentForContext.value).context);
        selectIntentForContext.options[0].selected = true;
    };

    getInfoBtn.onclick = async () => {
        const info = await fdc3.getInfo();
        setTextArea(`${JSON.stringify(info, null, 2)}`);
    }

    selectAppMetadata.onchange = async () => {
        const appId = selectAppMetadata.value;
        const appMetadata = await fdc3.getAppMetadata({ appId });
        setTextArea(`${JSON.stringify(appMetadata, null, 2)}`);
    }

    selectOpen.onchange = async () => {
        const selectedApp = selectOpen.value
        const appMetadata = await fdc3.open({ appId: selectedApp });
    }
}

const setup = async () => {
    await setupListeners();
    const viewName = document.querySelector('#view-name');
    viewName.innerHTML = fin.me.identity.name;
};

setup();

