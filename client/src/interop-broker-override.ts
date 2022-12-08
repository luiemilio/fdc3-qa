import * as OpenFin from "@openfin/core/src/OpenFin";
import * as FDC3 from '@openfin/core/src/api/interop/fdc3/shapes/fdc3v2';
import {  APP_DIRECTORY, showPicker, findAppIdByUrl, findUrlByAppId, standardizeUrl } from './utils';
import { CONTEXTS_MAP, INTENTS_METADATA_MAP,  } from "./contexts_intents";

declare const fin: OpenFin.Fin<"window" | "view">;

export const interopOverride = async (InteropBroker: { new(): OpenFin.InteropBroker }) => {
    class Override extends InteropBroker {
        async setContext(setContextOptions, clientIdentity) {
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
            const { entityType } = clientIdentity;
            const allClientInfo = await super.getAllClientInfo();
            const raiserClientInfo = allClientInfo.find((clientInfo) => clientInfo.name === clientIdentity.name);
            const raiserAppId = findAppIdByUrl(raiserClientInfo.connectionUrl);
            const modalParentIdentity = entityType === 'view' ? (await fin.View.wrapSync(clientIdentity).getCurrentWindow()).identity : clientIdentity;
            const targetApp = await showPicker(modalParentIdentity, 'app', { allClientInfo });

            const contextWithMetadata = {
                ...contextForIntent,
                contextMetadata: {
                    source: {
                        appId: raiserAppId,
                        instanceId: clientIdentity.endpointId
                    }
                }
            };

            const intent = {
                name: CONTEXTS_MAP.get(contextForIntent.type).intent,
                context: contextWithMetadata
            }

            if (!targetApp) {
                throw new Error('NoAppFound');
            }

            if (typeof targetApp !== 'string') {
                try {
                    const targetAppId = findAppIdByUrl(targetApp.connectionUrl);
                    await super.setIntentTarget(intent, targetApp);

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

        async fdc3HandleOpen({ app, context }: { app: any; context: OpenFin.Context; }, clientIdentity: OpenFin.ClientIdentity): Promise<any> {
            const appInfo = APP_DIRECTORY.apps.find(appInfo => appInfo.appId === app.appId);
            const platform = fin.Platform.getCurrentSync();

            await platform.createView({ url: appInfo.url, target: null });
        }

        async fdc3HandleGetAppMetadata(app: FDC3.AppIdentifier, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
            return APP_DIRECTORY.apps.find(appInfo => appInfo.appId === app.appId);
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