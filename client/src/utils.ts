import * as OpenFin from "@openfin/core/src/OpenFin";
import { interopOverride } from './interop-broker-override';

declare const fin: OpenFin.Fin<"window" | "view">;

// export const APP_DIRECTORY = require('../../public/app_directory.json');
export const APP_DIRECTORY = require('../../public/local-conformance-1_2.v2.json');

export const contextTypes = [
    'fdc3.contact',
    'fdc3.contactList',
    'fdc3.country',
    'fdc3.instrument',
    'fdc3.instrumentList',
    'fdc3.organization',
    'fdc3.portfolio',
    'fdc3.position'
];

export const getViewName = () => {
    return `view-${crypto.randomUUID()}`;
}

export const getPlatformOptions = () => {
    return {
        interopOverride
    };
};

export const getWindowOptions = (fdc3InteropApi = '1.2') => {
    return {
        fdc3InteropApi,
        layout: {
            content: [
                {
                    type: 'row',
                    content: [
                        {
                            type: 'component',
                            componentName: 'view',
                            componentState: {
                                fdc3InteropApi,
                                url: 'http://localhost:3001/v1.2/app/index.html',
                                name: getViewName()
                            }
                        }
                    ]
                }
            ]
        }
    }

};

export const createWindow = async (options = getWindowOptions()) => {
    const platform = fin.Platform.getCurrentSync();
    return platform.createWindow(options);
};

export const findAppIdByUrl = (url: string): string => {
    return APP_DIRECTORY.applications.find(appInfo => standardizeUrl(appInfo.details.url) === standardizeUrl(url)).appId;
}

export const findUrlByAppId = (appId: string): string => {
    const url = APP_DIRECTORY.applications.find(appInfo => appInfo.appId === appId).details.url;
    return standardizeUrl(url);
}

export const standardizeUrl = (url: string): string => {
    return new URL(url).href;
}



