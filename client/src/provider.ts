import * as OpenFin from "@openfin/core/src/OpenFin";
import { getPlatformOptions, createWindow } from './utils';

declare const fin: OpenFin.Fin<"window">;

const initPlatform = async () => {
	const platformOptions = getPlatformOptions();
	await fin.Platform.init(platformOptions);
};

const setupPlatform = async () => {
	try {
		await initPlatform();
		await createWindow();
	} catch (error) {
		throw new Error(error.message);
	}
};

await setupPlatform();