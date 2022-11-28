import * as OpenFin from "@openfin/core/src/OpenFin";

declare const fin: OpenFin.Fin<"window" | "view">;

export const CONTAINER_ID = "layout-container";
const openfinWindow: OpenFin.Window = fin.Window.getCurrentSync();
const openfinApplication: OpenFin.Application = fin.Application.getCurrentSync();

let lastFocusedView: OpenFin.Identity;

openfinApplication
	.on("view-focused", (viewEvent): void => {
		lastFocusedView = viewEvent.viewIdentity;
	})
	.catch((error) => console.error(error));

const changeContextGroup = async (event: Event): Promise<void> => {
	const selectedColorElement: HTMLElement = event.target as HTMLElement;
	const color: string = selectedColorElement.title;
	await fin.me.interop.joinContextGroup(color, lastFocusedView);
	const contextGroups = await fin.me.interop.getContextGroups();
	document
		.querySelector(`#tab-${lastFocusedView.name}`)
		.classList.remove(
			...contextGroups.map(({ displayMetadata }) => `${displayMetadata.name}-channel`)
		);
	document.querySelector(`#tab-${lastFocusedView.name}`).classList.add(`${color}-channel`);
};

const addContextGroupButtons = async (): Promise<void> => {
	const contextGroups = await fin.me.interop.getContextGroups();
	const windowFrameStyleSheet: CSSStyleSheet = document.styleSheets[0];

	for (const systemChannel of contextGroups) {
		windowFrameStyleSheet.insertRule(
			`.${systemChannel.displayMetadata.name}-channel { border-left: 2px solid ${systemChannel.displayMetadata.color} !important;}`
		);
		windowFrameStyleSheet.insertRule(
			`#${systemChannel.displayMetadata.name}-button:after { background-color: ${systemChannel.displayMetadata.color}}`
		);
		const newButton = document.createElement("div");
		newButton.classList.add("button");
		newButton.classList.add("channel-button");
		newButton.id = `${systemChannel.displayMetadata.name}-button`;
		newButton.title = systemChannel.displayMetadata.name;
		newButton.addEventListener("click", changeContextGroup);
		const minBtn = document.querySelector('#minimize-button');
		minBtn.parentNode.insertBefore(newButton, minBtn);
	}
};

const maxOrRestore = async (): Promise<void> => {
	if ((await openfinWindow.getState()) === "normal") {
		return openfinWindow.maximize();
	}

	return openfinWindow.restore();
};

const closeWindow = async (): Promise<void> => openfinWindow.close();

const minimizeWindow = async (): Promise<void> => openfinWindow.minimize();

const addView = async () => {
	const platform = fin.Platform.getCurrentSync();
	await platform.createView({ url: "http://localhost:5050/html/fdc3-client.html?client=1", target: null }, fin.me.identity);
};

const createWindow = async () => {
	const platform = fin.Platform.getCurrentSync();
	await platform.createWindow({
		layout: {
			content: [
				{
					type: 'row',
					content: [
						{
							type: 'component',
							componentName: 'view',
							componentState: {
								url: 'http://localhost:5050/html/fdc3-client.html?client=1'
							}
						},
						{
							type: 'component',
							componentName: 'view',
							componentState: {
								url: 'http://localhost:5050/html/fdc3-client.html?client=2'
							}
						}
					]
				}
			]
		}
	});
};

const setupTitleBar = async (): Promise<void> => {
	const title: HTMLElement = document.querySelector("#title");
	const minBtn: HTMLElement = document.querySelector("#minimize-button");
	const maxBtn: HTMLElement = document.querySelector("#expand-button");
	const closeBtn: HTMLElement = document.querySelector("#close-button");
	const addViewBtn: HTMLElement = document.querySelector("#add-view-button");
	const createWinBtn: HTMLElement = document.querySelector("#create-window-button");

	title.innerHTML = fin.me.identity.name;

	minBtn.addEventListener("click", minimizeWindow);
	maxBtn.addEventListener("click", maxOrRestore);
	closeBtn.addEventListener("click", closeWindow);
	addViewBtn.addEventListener('click', addView);
	createWinBtn.addEventListener('click', createWindow);

	await addContextGroupButtons();
};

window.addEventListener("DOMContentLoaded", async () => {
	await fin.Platform.Layout.init({ containerId: CONTAINER_ID });
	await setupTitleBar();
});
