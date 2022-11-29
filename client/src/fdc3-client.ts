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
            let message = `Broadcast Received:\ncontext: ${JSON.stringify(context, null, 2)}`;

            if (contextMetadata) {
                message = message + `\ncontextMetadata: ${JSON.stringify(contextMetadata, null, 2)}`;
            }

            setTextArea(message);
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

const setupFindInstancesListener = async () => {
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

const setupFindIntentListener = async () => {
    const selectFindIntent: HTMLSelectElement = document.querySelector('#select-find-intent');

    selectFindIntent.onchange = async () => {
        const intent = selectFindIntent.value;

        try {
            const appIntent = await fdc3.findIntent(intent);
            setTextArea(JSON.stringify(appIntent, null, 2));
        } catch (error) {
            setTextArea(error.message);
        }
    }

    selectFindIntent.options[0].selected = true;

}

const setupFindIntentsByContextListener = async () => {
    const selectFindIntentsByContext: HTMLSelectElement = document.querySelector('#select-find-intents-by-context');

    selectFindIntentsByContext.onchange = async () => {
        try {
            const contextType = selectFindIntentsByContext.value;
            const appIntents = await fdc3.findIntentsByContext(EXAMPLE_CONTEXTS_MAP.get(contextType).context);
            const appIntentsString = appIntents.map(appIntent => JSON.stringify(appIntent, null, 2)).join('\n');
            setTextArea(appIntentsString);
        } catch (error) {
            setTextArea(error.message);
        }
    }

    selectFindIntentsByContext.options[0].selected = true;
}

const setupLeaveCurrentChannelListener = async () => {
    const leaveCurrentChannelBtn: HTMLButtonElement = document.querySelector('#leave-current-channel');

    leaveCurrentChannelBtn.onclick = async () => {
        try {
            const currentChannel = await fdc3.getCurrentChannel();

            if (currentChannel) {
                await fdc3.leaveCurrentChannel();
                setTextArea(`Left Channel: ${currentChannel.id}`);
            } else {
                setTextArea('You have not joined a Channel');
            }
        } catch (error) {
            setTextArea(error.message);
        }
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
        setupFindInstancesListener(),
        setupFindIntentListener(),
        setupFindIntentsByContextListener(),
        setupLeaveCurrentChannelListener()
    ]);
}

const populateDropDowns = () => {
    const selectBroadcastContext: HTMLSelectElement = document.querySelector('#select-broadcast-context');
    const selectRaiseIntent: HTMLSelectElement = document.querySelector('#select-intent-to-raise');
    const selectIntentForContext: HTMLSelectElement = document.querySelector('#select-intent-to-raise-for-context');
    const selectIntent: HTMLSelectElement = document.querySelector('#select-intent');
    const selectOpen: HTMLSelectElement = document.querySelector('#select-open');
    const selectFindInstances: HTMLSelectElement = document.querySelector('#select-find-instances');
    const selectFindIntent: HTMLSelectElement = document.querySelector('#select-find-intent');
    const selectFindIntentsByContext: HTMLSelectElement = document.querySelector('#select-find-intents-by-context');

    INTENT_CONTEXT_MAP.forEach((context, intent) => {
        selectIntent.add(new Option(intent, intent));
        selectRaiseIntent.add(new Option(intent, intent));
        selectFindIntent.add(new Option(intent, intent));
    });

    EXAMPLE_CONTEXTS_MAP.forEach((contextTypeInfo, contextType) => {
        selectBroadcastContext.add(new Option(contextType, contextType));
        selectIntentForContext.add(new Option(contextType, contextType));
        selectFindIntentsByContext.add(new Option(contextType, contextType));
    });

    APP_DIRECTORY.forEach(appInfo => {
        selectOpen.add(new Option(appInfo.appId, appInfo.appId));
        selectFindInstances.add(new Option(appInfo.appId, appInfo.appId));
    });
}

const setHeaders = async () => {
    const { fdc3Version, appMetadata } = await fdc3.getInfo();
    const viewName = document.querySelector('#view-name');
    viewName.innerHTML = `Name: ${fin.me.identity.name}`;

    if (appMetadata) {
        const { appId, instanceId } = appMetadata;
        const viewAppId = document.querySelector('#view-app-id');
        const viewInstanceId = document.querySelector('#view-instance-id');
        viewAppId.innerHTML = `App ID: ${appId}`;
        viewInstanceId.innerHTML = `Instance ID: ${instanceId}`;
    }

    if (fdc3Version) {
        const fdc3VersionHeader = document.querySelector('#fdc3-version');
        fdc3VersionHeader.innerHTML = `FDC3 Version: ${fdc3Version}`;
    }
}

const setup = async () => {
    await setHeaders();
    populateDropDowns();
    await setupListeners();
};

setup();

