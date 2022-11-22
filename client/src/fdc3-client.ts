import * as OpenFin from "@openfin/core/src/OpenFin";
declare const fin: OpenFin.Fin<"window" | "view">;

declare const fdc3: any;

const joinChannelBtn: HTMLButtonElement = document.querySelector('#join-channel-btn');

joinChannelBtn.onclick = async () => {
    await fdc3.joinChannel('red');
    const currentChannel = await fdc3.getCurrentChannel();
    const joinChannelResult: HTMLSpanElement = document.querySelector('#join-channel-result');
    joinChannelResult.innerText = currentChannel.id === 'red' ? 'success' : 'fail';
};