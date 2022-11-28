import * as OpenFin from "@openfin/core/src/OpenFin";
import type { DesktopAgent, Listener } from '@openfin/core/src/api/interop/fdc3/shapes/fdc3v2';
import { EXAMPLE_CONTEXTS_MAP, INTENT_CONTEXT_MAP, APP_DIRECTORY } from './utils';

declare const fin: OpenFin.Fin<"window" | "view">;
declare const fdc3: DesktopAgent;

const setTextArea = (message) => {
    const resultTextArea: HTMLTextAreaElement = document.querySelector('#result-textarea');
    resultTextArea.value = message;
};

const setupBroadcastListener = async () => {
    const selectBroadcastContext: HTMLSelectElement = document.querySelector('#select-broadcast-context');

    try {
        await fdc3.addContextListener(null, (context, contextMetadata) => {
            setTextArea(`context: ${JSON.stringify(context, null, 2)}\ncontextMetadata: ${JSON.stringify(contextMetadata, null, 2)}`);
        });
    } catch (error) {
        setTextArea(error.message);
    }

    selectBroadcastContext.onchange = async () => {
        const selectedContextType = selectBroadcastContext.value;

        try {
            await fdc3.broadcast(EXAMPLE_CONTEXTS_MAP.get(selectedContextType).context);
        } catch (error) {
            setTextArea(error.message);
        }

        selectBroadcastContext.options[0].selected = true;
    };
}

const setupIntentListener = async () => {
    const selectIntent: HTMLSelectElement = document.querySelector('#select-intent');

    let intentListener: Listener;

    selectIntent.onchange = async () => {
        const intent = selectIntent.value;

        const intentHandler = (context, contextMetadata) => {
            setTextArea(`Handled ${intent} intent with the following context and metadata:\ncontext: ${JSON.stringify(context, null, 2)}\ncontextMetadata: ${JSON.stringify(contextMetadata, null, 2)}`);
        }

        try {
            if (intentListener) {
                await intentListener.unsubscribe();
            }
    
            intentListener = await fdc3.addIntentListener(selectIntent.value, intentHandler);   
        } catch (error) {
            setTextArea(error.message);
        }
    }
}

const setupRaiseIntentListener = async () => {
    const selectRaiseIntent: HTMLSelectElement = document.querySelector('#select-intent-to-raise');

    selectRaiseIntent.onchange = async () => {
        const selectedIntent = selectRaiseIntent.value;

        try {
            await fdc3.raiseIntent(selectedIntent, INTENT_CONTEXT_MAP.get(selectedIntent));
        } catch (error) {
            setTextArea(error.message);
        }

        selectRaiseIntent.options[0].selected = true;
    }

}

const setupRaiseIntentForContextListener = async () => {
    const selectIntentForContext: HTMLSelectElement = document.querySelector('#select-intent-to-raise-for-context');
    
    selectIntentForContext.onchange = async () => {
        try {
            const intentResolution = await fdc3.raiseIntentForContext(EXAMPLE_CONTEXTS_MAP.get(selectIntentForContext.value).context);
        } catch (error) {
            setTextArea(error.message);
        }

        selectIntentForContext.options[0].selected = true;
    };
}

const setupGetInfoListener = async () => {
    const getInfoBtn: HTMLButtonElement = document.querySelector('#get-info');

    getInfoBtn.onclick = async () => {
        try {
            const info = await fdc3.getInfo();
            setTextArea(JSON.stringify(info, null, 2));
        } catch (error) {
            setTextArea(error.message);
        }
    }
}

const setupGetAppMetadataListener = async () => {
    const inputAppId: HTMLInputElement = document.querySelector('#app-id-input');
    const inputInstanceId: HTMLInputElement = document.querySelector('#instance-id-input');
    const getAppMetadataBtn: HTMLButtonElement = document.querySelector('#get-app-metadata');
    
    getAppMetadataBtn.onclick = async () => {
        const appId = inputAppId.value;
        const instanceId = inputInstanceId.value
        try {
            const appMetadata = await fdc3.getAppMetadata({ appId, instanceId });
            setTextArea(JSON.stringify(appMetadata, null, 2));
        } catch (error) {
            setTextArea(error.message);
        }
            
    }
}

const setupOpenListener = async () => {
    const selectOpen: HTMLSelectElement = document.querySelector('#select-open');

    selectOpen.onchange = async () => {
        const selectedApp = selectOpen.value

        try {
            const appMetadata = await fdc3.open({ appId: selectedApp });
        } catch (error) {
            setTextArea(error.message);
        }
        
        selectOpen.options[0].selected = true;
    }
}

const setupFindInstances = async () => {
    const selectFindInstances: HTMLSelectElement = document.querySelector('#select-find-instances');

    selectFindInstances.onchange = async () => {
        const appId = selectFindInstances.value;
        
        try {
            const instances = await fdc3.findInstances({ appId });
            const instancesString = instances.map(instance => JSON.stringify(instance, null, 2)).join('\n');
            setTextArea(instancesString);
        } catch (error) {
            setTextArea(error.message);
        }

        selectFindInstances.options[0].selected = true;
    }
}

const setupListeners = async () => {
    return Promise.all([
        setupIntentListener(),
        setupBroadcastListener(),
        setupRaiseIntentListener(),
        setupRaiseIntentForContextListener(),
        setupGetInfoListener(),
        setupGetAppMetadataListener(),
        setupOpenListener(),
        setupFindInstances()
    ]);
}

const populateDropDowns = () => {
    const selectBroadcastContext: HTMLSelectElement = document.querySelector('#select-broadcast-context');
    const selectRaiseIntent: HTMLSelectElement = document.querySelector('#select-intent-to-raise');
    const selectIntentForContext: HTMLSelectElement = document.querySelector('#select-intent-to-raise-for-context');
    const selectIntent: HTMLSelectElement = document.querySelector('#select-intent');
    const selectOpen: HTMLSelectElement = document.querySelector('#select-open');
    const selectFindInstances: HTMLSelectElement = document.querySelector('#select-find-instances');

    INTENT_CONTEXT_MAP.forEach((context, intent) => {
        selectIntent.add(new Option(intent, intent));
        selectRaiseIntent.add(new Option(intent, intent));
    });

    EXAMPLE_CONTEXTS_MAP.forEach((contextTypeInfo, contextType) => {
        selectBroadcastContext.add(new Option(contextType, contextType));
        selectIntentForContext.add(new Option(contextType, contextType));
    });

    APP_DIRECTORY.forEach(appInfo => {
        selectOpen.add(new Option(appInfo.appId, appInfo.appId));
        selectFindInstances.add(new Option(appInfo.appId, appInfo.appId));
    });
}

const setIds = async () => {
    const viewAppId = document.querySelector('#view-app-id');
    const viewInstanceId = document.querySelector('#view-instance-id');
    const { appId, instanceId } = (await fdc3.getInfo()).appMetadata;
    viewAppId.innerHTML = `App ID: ${appId}`;
    viewInstanceId.innerHTML = `Instance ID: ${instanceId}`;
}

const setup = async () => {    
    await setIds();
    populateDropDowns();
    await setupListeners();
};

setup();

