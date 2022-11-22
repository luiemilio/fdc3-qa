import * as OpenFin from "@openfin/core/src/OpenFin";
declare const fin: OpenFin.Fin<"window" | "view">;

fin.Platform.init({
	interopOverride: async (InteropBroker, wire, getProvider, options) => {
		class Override extends InteropBroker {
			async setContext(setContextOptions, clientIdentity) {
				const contextWithMetadata = { ...setContextOptions.context,  contextMetadata: {
					source: {
						appId: clientIdentity.name,
						instanceId: clientIdentity.endpointId
					}
				}};

				return super.setContext({ context: contextWithMetadata },clientIdentity);
			}

			async handleFiredIntent(intent, clientIdentity) {
				const allClientInfo = await super.getAllClientInfo();
				const onlyViews = allClientInfo.filter(client => client.entityType === 'view');
				const apps = { apps: onlyViews };
				const queryString = new URLSearchParams(`apps=${JSON.stringify(apps)}`);
				const url = `http://localhost:5050/html/app-picker.html?${queryString.toString()}`;
				const contextWithMetadata = { ...intent.context,  contextMetadata: {
					source: {
						appId: clientIdentity.name,
						instanceId: clientIdentity.endpointId
					}
				}};

				await fin.Window.create({ 
					name: 'before-unload-dialog', 
					url, 
					modalParentIdentity: fin.me.identity, 
					frame: true, 
					defaultHeight: 240,
					defaultWidth: 400, 
					saveWindowState: false,
					defaultCentered: true,
					maximizable: false,
					minimizable: false,
					resizable: false
				});
			}
		}
		
		return new Override(wire, getProvider, options);
	}
});