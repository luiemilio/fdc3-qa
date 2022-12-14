import * as OpenFin from "@openfin/core/src/OpenFin";
import * as FDC3 from '@openfin/core/src/api/interop/fdc3/shapes/fdc3v2';
import { APP_DIRECTORY, showPicker, findAppIdByUrl, findUrlByAppId, standardizeUrl, getViewName } from './utils';
import { CONTEXTS_MAP, INTENTS_METADATA_MAP, contextTypes } from "./contexts_intents";

declare const fin: OpenFin.Fin<"window" | "view">;

export const interopOverride = async (InteropBroker: { new(): OpenFin.InteropBroker }) => {
    class Override extends InteropBroker {
        async setContext(setContextOptions, clientIdentity) {
            return super.setContext(setContextOptions, clientIdentity);
        }

        async handleFiredIntent(intent, clientIdentity) {
            const { name: intentName } = intent;
            const { uuid, name } = clientIdentity;
            const allClientInfo = await super.getAllClientInfo();
            const senderUrl = allClientInfo.find(clientInfo => clientInfo.uuid === uuid && clientInfo.name === name).connectionUrl;

            const appForIntent = APP_DIRECTORY.applications.find((appInfo) => {
                console.log(appInfo);
                
                if (appInfo.interop?.intents?.listensFor) {
                    const { interop: { intents: { listensFor } }, details: { url } } = appInfo;
                    return listensFor.hasOwnProperty(intentName) && listensFor[intentName].contexts.includes(intent.context.type);
                }
            });

            if (!appForIntent) {
                throw new Error('NoAppsFound');
            }

            const { details: { url }, version, name: appForIntentName, appId } = appForIntent;

            const platform = fin.Platform.getCurrentSync();
            const viewName = getViewName();
            const clientReadyPromise = new Promise((r) => fin.InterApplicationBus.subscribe({ uuid: '*' }, `connected-${fin.me.identity.uuid}-${viewName}`, r));

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
                    const { interop: { intents: { listensFor }}} = appInfo;
                    console.log('########## appInfo', appInfo);
                    return Object.values(listensFor).some((intentInfo: any) => intentInfo.contexts.includes(contextForIntent.type));
                }
            });

            if (!appForIntent) {
                throw new Error('NoAppsFound');
            }

            const { details: { url }, version, name: appForIntentName, appId } = appForIntent;

            const platform = fin.Platform.getCurrentSync();
            const viewName = getViewName();
            const clientReadyPromise = new Promise((r) => fin.InterApplicationBus.subscribe({ uuid: '*' }, `connected-${fin.me.identity.uuid}-${viewName}`, r));

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

        async fdc3HandleGetInfo(payload: { fdc3Version: string; }, clientIdentity: OpenFin.ClientIdentity): Promise<FDC3.ImplementationMetadata> {
            const defaultInfo: FDC3.ImplementationMetadata = await super.fdc3HandleGetInfo(payload, clientIdentity);
            const allClientInfo = await super.getAllClientInfo();
            const { connectionUrl, endpointId: instanceId } = allClientInfo.find(clientInfo => clientInfo.name === clientIdentity.name);
            const appId = findAppIdByUrl(connectionUrl);

            return {
                ...defaultInfo,
                optionalFeatures: {
                    ...defaultInfo.optionalFeatures,
                    "OriginatingAppMetadata": true
                },
                appMetadata: {
                    ...defaultInfo.appMetadata,
                    appId,
                    instanceId
                }
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
            // we need to figure out how to pass context directly to the app, FDC3 has no concept of this
            // const appInfo = APP_DIRECTORY.apps.find(appInfo => appInfo.appId === app.appId);
            const searchTerm = typeof app === 'string' ? app : app.appId || app.name

            const appInfo = APP_DIRECTORY.applications.find(appInfo => appInfo.appId === searchTerm || appInfo.name === searchTerm);

            if (!appInfo) {
                throw new Error('AppNotFound');
            }

            const { appId, details: { url } } = appInfo
            const platform = fin.Platform.getCurrentSync();
            const viewName = getViewName();
            const clientReadyPromise = new Promise((r) => fin.InterApplicationBus.subscribe({ uuid: '*' }, `connected-${fin.me.identity.uuid}-${viewName}`, r));

            if (context) {
                const { type } = context;
                const globalHandlerRegisteredPromise = new Promise((r) => fin.InterApplicationBus.subscribe({ uuid: '*' }, `invokeContextHandler-${fin.me.identity.uuid}-${viewName}`, r));
                const specificHandlerRegisteredPromise = new Promise((r) => fin.InterApplicationBus.subscribe({ uuid: '*' }, `${type}-${fin.me.identity.uuid}-${viewName}`, r));

                const invokeHandler = (payload: any) => {
                    const { handlerId, clientIdentity } = payload;
                    this.invokeContextHandler(clientIdentity, handlerId, context);
                }

                globalHandlerRegisteredPromise.then(invokeHandler);
                specificHandlerRegisteredPromise.then(invokeHandler);
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

        async fdc3HandleGetAppMetadata(app: FDC3.AppIdentifier, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
            // return APP_DIRECTORY.apps.find(appInfo => appInfo.appId === app.appId);
            return APP_DIRECTORY.applications.find(appInfo => appInfo.appId === app.appId);
        }

        async fdc3HandleFindInstances(app: FDC3.AppIdentifier, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
            const allClients = await super.getAllClientInfo();
            const { appId } = app;
            const url = findUrlByAppId(appId);

            return allClients
                .filter(clientInfo => {
                    return standardizeUrl(clientInfo.connectionUrl) === url
                })
                .map(clientInfo => {
                    return {
                        appId,
                        instanceId: clientInfo.endpointId
                    }
                });
        }

        async handleInfoForIntent(options: OpenFin.InfoForIntentOptions<OpenFin.IntentMetadata<any>>, clientIdentity: OpenFin.ClientIdentity): Promise<any> {
            const allClientInfo = await super.getAllClientInfo();

            const apps = allClientInfo
                .filter(clientInfo => clientInfo.entityType === 'view')
                .map((clientInfo) => {
                    const { endpointId: instanceId, connectionUrl } = clientInfo;
                    const appId = findAppIdByUrl(connectionUrl);

                    return {
                        appId,
                        instanceId
                    }
                });

            return {
                intent: INTENTS_METADATA_MAP.get(options.name),
                apps
            }
        }

        async handleInfoForIntentsByContext(context: OpenFin.Context, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
            const allClientInfo = await super.getAllClientInfo();

            const apps = allClientInfo
                .filter(clientInfo => clientInfo.entityType === 'view')
                .map((clientInfo) => {
                    const { endpointId: instanceId, connectionUrl } = clientInfo;
                    const appId = findAppIdByUrl(connectionUrl);

                    return {
                        appId,
                        instanceId
                    }
                });

            return [...INTENTS_METADATA_MAP.values()].map((intentMetadata) => {
                return {
                    intent: intentMetadata,
                    apps
                }
            })
        }
    }

    return new Override();
}