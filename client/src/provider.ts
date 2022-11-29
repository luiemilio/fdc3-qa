import * as OpenFin from "@openfin/core/src/OpenFin";
import * as FDC3 from '@openfin/core/src/api/interop/fdc3/shapes/fdc3v2';
import { EXAMPLE_CONTEXTS_MAP, APP_DIRECTORY, INTENTS_METADATA_MAP, showPicker } from './utils';
declare const fin: OpenFin.Fin<"window" | "view">;

fin.Platform.init({
	interopOverride: async (InteropBroker: { new(): OpenFin.InteropBroker }) => {
		class Override extends InteropBroker {
			private intentHandlerMap: any;

			constructor() {
				super();
				this.intentHandlerMap = new Map();
			}

			async setContext(setContextOptions, clientIdentity) {
				const appId = clientIdentity.name.startsWith('fdc3-client-two') ? 'fdc3-client-two' : 'fdc3-client-one';

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
				const modalParentIdentity = entityType === 'view' ? (await fin.View.wrapSync(clientIdentity).getCurrentWindow()).identity : clientIdentity;
				const appId = clientIdentity.name.startsWith('fdc3-client-two') ? 'fdc3-client-two' : 'fdc3-client-one';


				const contextWithMetadata = {
					...intent.context,
					contextMetadata: {
						source: {
							appId,
							instanceId: clientIdentity.endpointId
						}
					}
				};

				const targetApp = await showPicker(modalParentIdentity, 'app', { allClientInfo });

				if (targetApp && typeof targetApp !== 'string') {
					return super.setIntentTarget({
						...intent,
						name,
						context: contextWithMetadata
					}, targetApp);
				}
			}

			async handleFiredIntentForContext(contextForIntent: OpenFin.ContextForIntent<any>, clientIdentity: OpenFin.ClientIdentity & { entityType: string }): Promise<unknown> {
				const { entityType } = clientIdentity;
				const allClientInfo = await super.getAllClientInfo();
				const modalParentIdentity = entityType === 'view' ? (await fin.View.wrapSync(clientIdentity).getCurrentWindow()).identity : clientIdentity;
				const targetApp = await showPicker(modalParentIdentity, 'app', { allClientInfo });
				const appId = clientIdentity.name.startsWith('fdc3-client-two') ? 'fdc3-client-two' : 'fdc3-client-one';

				const contextWithMetadata = {
					...contextForIntent,
					contextMetadata: {
						source: {
							appId,
							instanceId: clientIdentity.endpointId
						}
					}
				};

				const intent = {
					name: EXAMPLE_CONTEXTS_MAP.get(contextForIntent.type).intent,
					context: contextWithMetadata
				}

				if (targetApp && typeof targetApp !== 'string') {
					return super.setIntentTarget(intent, targetApp);
				}
			}

			async fdc3HandleGetInfo(payload: { fdc3Version: string; }, clientIdentity: OpenFin.ClientIdentity): Promise<FDC3.ImplementationMetadata> {
				const defaultInfo: FDC3.ImplementationMetadata = await super.fdc3HandleGetInfo(payload, clientIdentity);
				const allClientInfo = await super.getAllClientInfo();
				const { connectionUrl, endpointId: instanceId } = allClientInfo.find(clientInfo => clientInfo.name === clientIdentity.name);
				const appId = connectionUrl.endsWith('?client=2') ? 'fdc3-client-two' : 'fdc3-client-one';

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
				const appInfo = APP_DIRECTORY.find(appInfo => appInfo.appId === app.appId);
				const platform = fin.Platform.getCurrentSync();

				await platform.createView({ url: appInfo.url, target: null });
			}

			async fdc3HandleGetAppMetadata(app: FDC3.AppIdentifier, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
				return APP_DIRECTORY.find(appInfo => appInfo.appId === app.appId);
			}

			async fdc3HandleFindInstances(app: FDC3.AppIdentifier, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
				const allClients = await super.getAllClientInfo();
				const { appId } = app;
				const urlEnd = appId === 'fdc3-client-two' ? '?client=2' : '?client=1';

				return allClients
					.filter(clientInfo => {
						return clientInfo.connectionUrl.endsWith(urlEnd);
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
						const appId = connectionUrl.endsWith('?client=2') ? 'fdc3-client-two' : 'fdc3-client-one';

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
						const appId = connectionUrl.endsWith('?client=2') ? 'fdc3-client-two' : 'fdc3-client-one';

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
});