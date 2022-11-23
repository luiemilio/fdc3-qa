import * as OpenFin from "@openfin/core/src/OpenFin";
declare const fin: OpenFin.Fin<"window" | "view">;

fin.Platform.init({
	interopOverride: async (InteropBroker) => {
		class Override extends InteropBroker {
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
				const providerName = `app-picker-${modalParentIdentity.name}-${modalParentIdentity.uuid}`;
				const queryString = new URLSearchParams(`apps=${JSON.stringify(apps)}&provider=${providerName}`);
				const url = `http://localhost:5050/html/app-picker.html?${queryString.toString()}`;
				const appPicker = fin.Window.wrapSync({ uuid: fin.me.identity.uuid, name: providerName });
				const provider = await fin.InterApplicationBus.Channel.create(providerName);

				appPicker.on('closed', () => {
					provider.destroy();
				});

				return new Promise(async (resolve, reject) => {
					provider.register('target-app', (targetApp: OpenFin.ClientInfo) => {
						resolve(targetApp);
					});

					await fin.Window.create({
						name: providerName,
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
				const modalParentIdentity = entityType === 'view' ? (await fin.View.wrapSync(clientIdentity).getCurrentWindow()).identity : clientIdentity;

				const contextWithMetadata = {
					...intent.context, contextMetadata: {
						source: {
							appId: clientIdentity.name,
							instanceId: clientIdentity.endpointId
						}
					}
				};

				const targetApp = await this.getAppForIntent(modalParentIdentity);

				return super.setIntentTarget({ ...intent, context: contextWithMetadata }, { uuid: targetApp.uuid, name: targetApp.name });
			}
		}

		return new Override();
	}
});