import * as OpenFin from "@openfin/core/src/OpenFin";
import * as FDC3 from '@openfin/core/src/api/interop/fdc3/shapes/fdc3v2';
import { APP_DIRECTORY, getViewName } from './utils';

declare const fin: OpenFin.Fin<"window" | "view">;

export const interopOverride = async (InteropBroker: { new(): OpenFin.InteropBroker }) => {
    class Override extends InteropBroker {
        async handleFiredIntent(intent, clientIdentity) {
            const { name: intentName, metadata } = intent;

            const targetAppInfo = APP_DIRECTORY.applications.find((appInfo) => {
                const { appId, name, interop } = appInfo;

                if (interop?.intents?.listensFor) {
                    const { intents: { listensFor } } = interop;
                    const canHandleIntent = listensFor.hasOwnProperty(intentName) && listensFor[intentName].contexts.includes(intent.context.type);

                    if (metadata?.target) {
                        const { target } = metadata;
                        const searchTerm = typeof target === 'string' ? target : target.appId || target.name
                        const hasApp = appId === searchTerm || name === searchTerm;

                        return hasApp && canHandleIntent;
                    }

                    return canHandleIntent;
                }
            });

            if (!targetAppInfo) {
                throw new Error('NoAppsFound');
            }

            const { details: { url }, version, name: appForIntentName, appId } = targetAppInfo;

            const platform = fin.Platform.getCurrentSync();
            const viewName = getViewName();
            const clientReadyPromise = this.setupClientReadyPromise(fin.me.identity.uuid, viewName);

            try {
                await platform.createView({ name: viewName, url, target: null });
                await clientReadyPromise;

                return {
                    source: {
                        name: appForIntentName,
                        appId
                    },
                    version
                }
            } catch (error) {
                throw new Error(error.message);
            }
        }

        async handleFiredIntentForContext(contextForIntent: OpenFin.ContextForIntent<any>, clientIdentity: OpenFin.ClientIdentity & { entityType: string }): Promise<unknown> {
            const appForIntent = APP_DIRECTORY.applications.find((appInfo) => {
                if (appInfo.interop?.intents?.listensFor) {
                    const { interop: { intents: { listensFor } } } = appInfo;

                    return Object.values(listensFor).some((intentInfo: any) => { 
                        intentInfo.contexts.includes(contextForIntent.type);
                    });
                }
            });

            if (!appForIntent) {
                throw new Error('NoAppsFound');
            }

            const { details: { url }, version, name: appForIntentName, appId } = appForIntent;

            const platform = fin.Platform.getCurrentSync();
            const viewName = getViewName();
            const clientReadyPromise = this.setupClientReadyPromise(fin.me.identity.uuid, viewName);

            try {
                await platform.createView({ name: viewName, url, target: null });
                await clientReadyPromise;

                return {
                    source: {
                        name: appForIntentName,
                        appId
                    },
                    version
                }
            } catch (error) {
                throw new Error(error.message);
            }
        }

        async isConnectionAuthorized(id, payload) {
            const { uuid, name } = id;
            fin.InterApplicationBus.publish(`connected-${uuid}-${name}`, {});
            return true;
        }

        contextHandlerRegistered(
            payload: any,
            clientIdentity: OpenFin.ClientIdentity
        ) {
            const { contextType, handlerId } = payload;
            const { uuid, name } = clientIdentity;
            const topic = `${contextType || 'invokeContextHandler'}-${uuid}-${name}`;

            fin.InterApplicationBus.publish(topic, { handlerId, clientIdentity });

            super.contextHandlerRegistered(payload, clientIdentity);
        }

        async fdc3HandleOpen({ app, context }: { app: any; context: OpenFin.Context; }, clientIdentity: OpenFin.ClientIdentity): Promise<any> {
            const searchTerm = typeof app === 'string' ? app : app.appId || app.name

            const appInfo = APP_DIRECTORY.applications.find(appInfo => appInfo.appId === searchTerm || appInfo.name === searchTerm);

            if (!appInfo) {
                throw new Error('AppNotFound');
            }

            const { appId, details: { url } } = appInfo
            const platform = fin.Platform.getCurrentSync();
            const viewName = getViewName();
            const clientReadyPromise = this.setupClientReadyPromise(fin.me.identity.uuid, viewName);

            if (context) {
                this.setupContextHandlerPromises(fin.me.identity.uuid, viewName, context);
            }

            try {
                const view = await platform.createView({ name: viewName, url, target: null });
                await clientReadyPromise;
                const allClientInfo = await super.getAllClientInfo();
                const viewClientInfo = allClientInfo.find(clientInfo => clientInfo.name === view.identity.name);

                return {
                    appId,
                    instanceId: viewClientInfo.endpointId
                }
            } catch (error) {
                throw new Error(error.message);
            }
        }

        async handleInfoForIntent(options: OpenFin.InfoForIntentOptions<OpenFin.IntentMetadata<any>>, clientIdentity: OpenFin.ClientIdentity): Promise<any> {
            const { name: intentName, context, metadata } = options;

            let intentInfo;

            const apps = APP_DIRECTORY.applications.filter((appInfo) => {
                const { appId, name, interop } = appInfo;

                if (interop?.intents?.listensFor) {
                    const { intents: { listensFor } } = interop;
                    const hasIntent = listensFor.hasOwnProperty(intentName);
                    const conditionsToCheck = [hasIntent];

                    if (context) {
                        const hasContext = listensFor[intentName]?.contexts?.includes(context.type);
                        conditionsToCheck.push(hasContext);
                    }

                    if (metadata?.target) {
                        const { target } = metadata;
                        const searchTerm = typeof target === 'string' ? target : target.appId || target.name
                        const hasApp = appId === searchTerm || name === searchTerm;

                        conditionsToCheck.push(hasApp);
                    }

                    const validApp = conditionsToCheck.every(condition => condition);

                    if (validApp && !intentInfo) {
                        intentInfo = {
                            name: intentName,
                            displayName: listensFor?.[intentName]?.displayName
                        }
                    }

                    return validApp;
                }
            }).map((appInfo) => {
                const { name, appId, version, title, tooltip, description, icons, images } = appInfo;
                return { name, appId, version, title, tooltip, description, icons, images };
            });

            if (apps.length === 0) {
                throw new Error('NoAppsFound');
            }

            const appIntent = {
                intent: intentInfo,
                apps
            };

            return appIntent;
        }

        async handleInfoForIntentsByContext(context: OpenFin.Context, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
            const appIntentsMap = new Map();

            APP_DIRECTORY.applications.forEach((appInfo) => {
                if (appInfo.interop?.intents?.listensFor) {
                    const { interop: { intents: { listensFor } } } = appInfo;

                    for (const [intentName, intentInfo] of Object.entries(listensFor)) {
                        const { contexts, displayName } = intentInfo as any;

                        if (contexts.includes(context.type)) {
                            if (!appIntentsMap.has(intentName)) {
                                appIntentsMap.set(intentName, { intent: { name: intentName, displayName }, apps: [appInfo] })
                            } else {
                                const appIntent = appIntentsMap.get(intentName);
                                appIntent.apps.push(appInfo);
                            }
                        }
                    }
                }
            });

            const appIntents = [...appIntentsMap.values()];

            if (appIntents.length === 0) {
                throw new Error('NoAppsFound');
            }

            return appIntents;
        }

        setupClientReadyPromise(uuid: string, name: string): Promise<void> {
            return new Promise((r) => { 
                fin.InterApplicationBus.subscribe({ uuid: '*' }, `connected-${uuid}-${name}`, r);
            });
        }
        
        setupContextHandlerPromises(uuid: string, name: string, context: OpenFin.Context): void {
            const { type } = context;

            const invokeHandler = (payload: any) => {
                const { handlerId, clientIdentity } = payload;
                super.invokeContextHandler(clientIdentity, handlerId, context);
            }

            const globalHandlerRegisteredPromise = new Promise((r) => {
                const topic = `invokeContextHandler-${uuid}-${name}`;
                fin.InterApplicationBus.subscribe({ uuid: '*' }, topic, r)
            });

            const specificHandlerRegisteredPromise = new Promise((r) => {
                const topic = `${type}-${uuid}-${name}`
                fin.InterApplicationBus.subscribe({ uuid: '*' }, topic, r)
            });

            globalHandlerRegisteredPromise.then(invokeHandler);
            specificHandlerRegisteredPromise.then(invokeHandler);
        }
    }

    return new Override();
}