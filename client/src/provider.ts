import * as OpenFin from "@openfin/core/src/OpenFin";
import * as FDC3 from '@openfin/core/src/api/interop/fdc3/shapes/fdc3v2';
import { EXAMPLE_CONTEXTS_MAP, getAppDirectory } from './constants';
declare const fin: OpenFin.Fin<"window" | "view">;

fin.Platform.init({
	interopOverride: async (InteropBroker: { new(): OpenFin.InteropBroker }) => {
		class Override extends InteropBroker {
			appDirectoryPromise: Promise<any>;

			constructor() {
				super();
				this.appDirectoryPromise = getAppDirectory();
			}

			async setContext(setContextOptions, clientIdentity) {
				const contextWithMetadata = {
					...setContextOptions.context, contextMetadata: {
						source: {
							appId: clientIdentity.name,
							instanceId: clientIdentity.endpointId
						}
					}
				};

				return super.setContext({ context: contextWithMetadata }, clientIdentity);
			}

			async getAppForIntent(modalParentIdentity): Promise<OpenFin.ClientInfo> {
				const allClientInfo = await super.getAllClientInfo();
				const onlyViews = allClientInfo.filter(client => client.entityType === 'view');
				const apps = { apps: onlyViews };
				const appPickerName = `app-picker-${modalParentIdentity.name}-${modalParentIdentity.uuid}`;
				const queryString = new URLSearchParams(`apps=${JSON.stringify(apps)}&provider=${appPickerName}-app-picker-provider`);
				const url = `http://localhost:5050/html/app-picker.html?${queryString.toString()}`;
				const appPicker = fin.Window.wrapSync({ uuid: fin.me.identity.uuid, name: appPickerName });
				const provider = await fin.InterApplicationBus.Channel.create(`${appPickerName}-app-picker-provider`);

				appPicker.once('closed', async () => {
					await provider.destroy();
				});

				return new Promise(async (resolve, reject) => {
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

				const contextWithMetadata = {
					...intent.context,
					contextMetadata: {
						source: {
							appId: clientIdentity.name,
							instanceId: clientIdentity.endpointId
						}
					}
				};

				const targetApp = await this.getAppForIntent(modalParentIdentity);
				console.log('##### intent ', intent);
				console.log('####### name: ', name.startsWith('fdc3.') ? name.substring(4) : name);

				return super.setIntentTarget({ 
					...intent,
					name: name.startsWith('fdc3.') ? name.substring(5) : name, 
					context: contextWithMetadata 
				}, targetApp);
			}

			async handleFiredIntentForContext(contextForIntent: OpenFin.ContextForIntent<any>, clientIdentity: OpenFin.ClientIdentity & { entityType: string }): Promise<unknown> {
				const { entityType } = clientIdentity;
				const modalParentIdentity = entityType === 'view' ? (await fin.View.wrapSync(clientIdentity).getCurrentWindow()).identity : clientIdentity;
				const targetApp = await this.getAppForIntent(modalParentIdentity);

				const contextWithMetadata = {
					...contextForIntent,
					contextMetadata: {
						source: {
							appId: clientIdentity.name,
							instanceId: clientIdentity.endpointId
						}
					}
				};

				const intent = {
					name: EXAMPLE_CONTEXTS_MAP.get(contextForIntent.type).intent,
					context: contextWithMetadata
				}

				return super.setIntentTarget(intent, targetApp);
			}

			async fdc3HandleGetInfo(payload: { fdc3Version: string; }, clientIdentity: OpenFin.ClientIdentity): Promise<FDC3.ImplementationMetadata> {
				const defaultInfo: FDC3.ImplementationMetadata = await super.fdc3HandleGetInfo(payload, clientIdentity);
				const allClientInfo = await super.getAllClientInfo();
				const instanceId = allClientInfo.find(clientInfo => clientInfo.name === clientIdentity.name).endpointId;

				return {
					...defaultInfo,
					optionalFeatures: {
						...defaultInfo.optionalFeatures,
						"OriginatingAppMetadata": true
					},
					appMetadata: {
						...defaultInfo.appMetadata,
						appId: clientIdentity.name,
						instanceId
					}
				}
			}

			async fdc3HandleOpen({ app, context }: { app: any; context: OpenFin.Context; }, clientIdentity: OpenFin.ClientIdentity): Promise<any> {
				const appDirectory = await this.appDirectoryPromise;
				const appInfo = appDirectory.find(appInfo => appInfo.appId === app.appId);
				const platform = fin.Platform.getCurrentSync();
				console.log('####### appInfo', appInfo);
				await platform.createView({ url: appInfo.details.url, target: null });
			}

			async fdc3HandleGetAppMetadata(app: FDC3.AppIdentifier, clientIdentity: OpenFin.ClientIdentity): Promise<void> {
				const appDirectory = await this.appDirectoryPromise;
				return appDirectory.find(appInfo => appInfo.appId === app.appId);
			}
		}

		return new Override();
	}
});