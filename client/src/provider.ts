import * as OpenFin from "@openfin/core/src/OpenFin";
declare const fin: OpenFin.Fin<"window" | "view">;

const providerOptions = {
	interopOverride: async (InteropBroker: { new (): OpenFin.InteropBroker }) => {
		class Override extends InteropBroker {
			async handleFiredIntent(intent: OpenFin.Intent<OpenFin.IntentMetadata<any>>, clientIdentity: OpenFin.ClientIdentity): Promise<unknown> {
				return super.handleFiredIntent(intent, clientIdentity);
			}
		}
		return new Override();
	}
}

fin.Platform.init(providerOptions);