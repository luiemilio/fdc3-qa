import * as OpenFin from "@openfin/core/src/OpenFin";
import { interopOverride } from './interop-broker-override';

declare const fin: OpenFin.Fin<"window" | "view">;

export const APP_DIRECTORY = require('../../public/app_directory.json');

export const getViewName = () => {
    return `view-${crypto.randomUUID()}`;
}

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
            resolve(result);
        });

        await fin.Window.create({
            name: pickerName,
            url,
            modalParentIdentity,
            frame: true,
            defaultHeight: 240,
            defaultWidth: 500,
            saveWindowState: false,
            defaultCentered: true,
            maximizable: false,
            minimizable: false,
            resizable: false
        });
    });
}

export const getPlatformOptions = () => {
    return {
        interopOverride
    };
};

export const getWindowOptions = (fdc3InteropApi = '2.0') => {
    const viewComponents = APP_DIRECTORY.apps.map((appInfo) => {
        return {
            type: 'component',
            componentName: 'view',
            componentState: {
                fdc3InteropApi,
                url: appInfo.url,
                name: getViewName()
            }
        }
    });

    return {
        fdc3InteropApi,
        layout: {
            content: [
                {
                    type: 'row',
                    content: viewComponents
                }
            ]
        }
    }
};

export const createWindow = async (options = getWindowOptions()) => {
    const platform = fin.Platform.getCurrentSync();
    return platform.createWindow(options);
};

export const findAppIdByUrl = (url: string): string | undefined => {
    return APP_DIRECTORY.apps.find(appInfo => standardizeUrl(appInfo.url) === standardizeUrl(url)).appId;
}

export const findUrlByAppId = (appId: string): string | undefined => {
    const appInfo = APP_DIRECTORY.apps.find(appInfo => appInfo.appId === appId);
    return appInfo?.url ? standardizeUrl(appInfo.url) : undefined;
}

export const standardizeUrl = (url: string): string => {
    return new URL(url).href;
}

export const findIntentName = (appId, contextType): string | undefined => {
    return APP_DIRECTORY.apps.find(appInfo => appInfo.appId === appId).contextMapping[contextType];
}

export const findAppInfoByAppId = (appId: string): any => {
    return APP_DIRECTORY.apps.find(appInfo => appInfo.appId === appId);
}
