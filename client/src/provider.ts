import * as OpenFin from "@openfin/core/src/OpenFin";
import * as FDC3 from '@openfin/core/src/api/interop/fdc3/shapes/fdc3v2';
import { EXAMPLE_CONTEXTS_MAP, APP_DIRECTORY } from './utils';
declare const fin: OpenFin.Fin<"window" | "view">;

fin.Platform.init({
	interopOverride: async (InteropBroker: { new(): OpenFin.InteropBroker }) => {
		class Override extends InteropBroker {
			appDirectory: FDC3.AppMetadata[];

			constructor() {
				super();
				this.appDirectory = APP_DIRECTORY;
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

			async getAppForIntent(modalParentIdentity): Promise<OpenFin.ClientInfo | void> {
				const allClientInfo = await super.getAllClientInfo();
				const onlyViews = allClientInfo.filter(client => client.entityType === 'view');
				console.log('###### onlyViews', onlyViews);
				const apps = { apps: onlyViews };
				const appPickerName = `app-picker-${modalParentIdentity.name}-${modalParentIdentity.uuid}`;
				const queryString = new URLSearchParams(`apps=${JSON.stringify(apps)}&provider=${appPickerName}-app-picker-provider`);
				const url = `http://localhost:5050/html/app-picker.html?${queryString.toString()}`;
				const appPicker = fin.Window.wrapSync({ uuid: fin.me.identity.uuid, name: appPickerName });
				const provider = await fin.InterApplicationBus.Channel.create(`${appPickerName}-app-picker-provider`);

				return new Promise(async (resolve, reject) => {
					appPicker.once('closed', async () => {
						await provider.destroy();
						resolve();
					});

					provider.register('target-app', (targetApp: OpenFin.ClientInfo) => {
						resolve(targetApp);
					});

					await fin.Window.create({
						name: appPickerName,
						url,
						modalParentIdentity,
						frame: true,
						defaultHeight: 240,
						defaultWidth: 400,
						saveWindowState: false,
						defaultCentered: true,
						maximizable: false,
						minimizable: false,
						resizable: false
					});
				});
			}

			async handleFiredIntent(intent, clientIdentity) {
				const { entityType } = clientIdentity;
				const { name } = intent;

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

				const targetApp = await this.getAppForIntent(modalParentIdentity);

				if (targetApp) {
					return super.setIntentTarget({
						...intent,
						name,
						context: contextWithMetadata
					}, targetApp);
				}
			}

			async handleFiredIntentForContext(contextForIntent: OpenFin.ContextForIntent<any>, clientIdentity: OpenFin.ClientIdentity & { entityType: string }): Promise<unknown> {
				const { entityType } = clientIdentity;
				const modalParentIdentity = entityType === 'view' ? (await fin.View.wrapSync(clientIdentity).getCurrentWindow()).identity : clientIdentity;
				const targetApp = await this.getAppForIntent(modalParentIdentity);
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

				if (targetApp) {
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
				const appInfo = this.appDirectory.find(appInfo => appInfo.appId === app.appId);
				const platform = fin.Platform.getCurrentSync();

				await platform.createView({ url: appInfo.url, target: null });
			}

			async fdc3HandleGetAppMetadata(app: FDC3.AppIdentifier, clientIdentity: OpenFin.ClientIdentity): Promise<void> {
				return this.appDirectory.find(appInfo => appInfo.appId === app.appId);
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
		}

		return new Override();
	}
});