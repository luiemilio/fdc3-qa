import * as OpenFin from "@openfin/core/src/OpenFin";
import * as FDC3 from '@openfin/core/src/api/interop/fdc3/shapes/fdc3v2';
import { APP_DIRECTORY, showPicker, findAppIdByUrl, findUrlByAppId, standardizeUrl, getViewName, findIntentName } from './utils';
import { INTENTS_METADATA_MAP, INTENT_CONTEXT_MAP } from "./contexts_intents";

declare const fin: OpenFin.Fin<"window" | "view">;

export const interopOverride = async (InteropBroker: { new(): OpenFin.InteropBroker }, wire: any, getProvider: any, options: { contextGroups: any[]; }) => {
    class Override extends InteropBroker {
        async setContext(setContextOptions, clientIdentity) {
            options.contextGroups = [];  
            const allClientInfo = await super.getAllClientInfo();
            const broadcasterClientInfo = allClientInfo.find((clientInfo) => clientInfo.name === clientIdentity.name);
            const appId = findAppIdByUrl(broadcasterClientInfo.connectionUrl);

            const contextWithMetadata = {
                ...setContextOptions.context, contextMetadata: {
                    source: {
                        appId,
                        instanceId: clientIdentity.endpointId
                    }
                }
            };

            return super.setContext({ context: contextWithMetadata }, clientIdentity);
        }

        async handleFiredIntent(intent, clientIdentity) {
            const { entityType } = clientIdentity;
            const { name } = intent;
            const allClientInfo = await super.getAllClientInfo();
            const raiserClientInfo = allClientInfo.find((clientInfo) => clientInfo.name === clientIdentity.name);
            const sourceAppId = findAppIdByUrl(raiserClientInfo.connectionUrl);
            const modalParentIdentity = entityType === 'view' ? (await fin.View.wrapSync(clientIdentity).getCurrentWindow()).identity : clientIdentity;

            const targetApp = await showPicker(modalParentIdentity, 'app', { allClientInfo }) as OpenFin.ClientInfo;

            const contextWithMetadata = {
                ...intent.context,
                contextMetadata: {
                    source: {
                        appId: sourceAppId,
                        instanceId: clientIdentity.endpointId
                    }
                }
            };

            if (!targetApp) {
                throw new Error('NoAppFound');
            }

            try {
                await super.setIntentTarget({ ...intent, name, context: contextWithMetadata }, targetApp);
                const targetAppId = findAppIdByUrl(targetApp.connectionUrl);

                return {
                    source: {
                        appId: targetAppId,
                        instanceId: targetApp.endpointId
                    },
                    intent: name
                }
            } catch (error) {
                throw new Error(error.message);
            }
        }

        async handleFiredIntentForContext(contextForIntent: OpenFin.ContextForIntent<any>, clientIdentity: OpenFin.ClientIdentity & { entityType: string }): Promise<unknown> {
            const { metadata, type } = contextForIntent;
            const allClientInfo = await super.getAllClientInfo();
            const raiserClientInfo = allClientInfo.find((clientInfo) => clientInfo.name === clientIdentity.name);
            const raiserAppId = findAppIdByUrl(raiserClientInfo.connectionUrl);
            let launchApp = false;
            let targetApp;
            let intentName;
            let targetAppId;
            let targetAppInstanceId;

            if (metadata?.target?.app) {
                const { target: { app } } = metadata;
                targetAppId = app.appId;

                if (app.instanceId) {
                    targetApp = allClientInfo.find(clientInfo => clientInfo.endpointId === app.instanceId);
                    
                    if(!targetApp) {
                        throw new Error('TargetInstanceUnavailable');
                    }
                    
                    targetAppInstanceId = app.instanceId;
                } else {
                    const viewName = getViewName();
                    const targetAppUrl = findUrlByAppId(app.appId);

                    if (!targetAppUrl) {
                        throw new Error('TargetAppUnavailable');
                    }
    
                    targetApp = targetAppUrl ? { uuid: fin.me.identity.uuid, name: viewName, url: targetAppUrl, target: null } : undefined;
                    launchApp = true;
                }

                intentName = findIntentName(app.appId, type);
            } else {
                const { entityType } = clientIdentity;
                const modalParentIdentity = entityType === 'view' ? (await fin.View.wrapSync(clientIdentity).getCurrentWindow()).identity : clientIdentity;
                targetApp = await showPicker(modalParentIdentity, 'app', { allClientInfo });

                if (!targetApp) {
                    throw new Error('UserCancelledResolution');
                }

                targetAppId = findAppIdByUrl(targetApp.connectionUrl);
                const client = await fin.InterApplicationBus.Channel.connect(`provider-${targetApp.name}`);
                intentName = await client.dispatch('getSelectedIntent');
            }

            try {
                const contextWithMetadata = {
                    ...INTENT_CONTEXT_MAP.get(intentName),
                    ...contextForIntent,
                    contextMetadata: {
                        source: {
                            appId: raiserAppId,
                            instanceId: clientIdentity.endpointId
                        }
                    }
                };

                const intent = { name: intentName, context: contextWithMetadata };
                await super.setIntentTarget(intent, targetApp);

                if (launchApp) {
                    const platform = fin.Platform.getCurrentSync();
                    platform.createView(targetApp);
                }

                return {
                    source: {
                        appId: targetAppId,
                        instanceId: targetApp.endpointId
                    },
                    intent: intent.name
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
            fin.InterApplicationBus.publish(`${uuid}-${name}-connected`, {});
            return true;
        }

        async fdc3HandleOpen({ app, context }: { app: any; context: OpenFin.Context; }, clientIdentity: OpenFin.ClientIdentity): Promise<any> {
            // we need to figure out how to pass context directly to the app, FDC3 has no concept of this
            const appInfo = APP_DIRECTORY.apps.find(appInfo => appInfo.appId === app.appId);

            if (!appInfo) {
                throw new Error('AppNotFound');
            }

            const { appId, url } = appInfo;
            const platform = fin.Platform.getCurrentSync();
            const viewName = getViewName();
            const clientReadyPromise = new Promise((r) => fin.InterApplicationBus.subscribe({ uuid: '*' }, `${fin.me.identity.uuid}-${viewName}-connected`, r));

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
                throw new Error('ErrorOnLaunch');
            }
        }

        async fdc3HandleGetAppMetadata(app: FDC3.AppIdentifier, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
            return APP_DIRECTORY.apps.find(appInfo => appInfo.appId === app.appId);
        }

        async fdc3HandleFindInstances(app: FDC3.AppIdentifier, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
            try {
                const allClients = await super.getAllClientInfo();
                const { appId } = app;
                const url = findUrlByAppId(appId);

                const instances = allClients
                    .filter(clientInfo => {
                        return standardizeUrl(clientInfo.connectionUrl) === url
                    })
                    .map(clientInfo => {
                        return {
                            appId,
                            instanceId: clientInfo.endpointId
                        }
                    });

                return instances
            } catch (error) {
                throw new Error('ResolverUnavailable');
            }
        }

        async handleInfoForIntent(options: OpenFin.InfoForIntentOptions<OpenFin.IntentMetadata<any>>, clientIdentity: OpenFin.ClientIdentity): Promise<any> {
            try {
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

                if (apps.length === 0) {
                    throw new Error('NoAppsFound');
                }

                return {
                    intent: INTENTS_METADATA_MAP.get(options.name),
                    apps
                }
            } catch (error) {
                throw new Error('ResolverUnavailable');
            }
        }

        async handleInfoForIntentsByContext(context: OpenFin.Context | OpenFin.FindIntentsByContextOptions<OpenFin.IntentMetadata<any>>, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
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

            if (apps.length === 0) {
                throw new Error('NoAppsFound');
            }

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