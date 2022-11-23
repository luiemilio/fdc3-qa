import * as OpenFin from "@openfin/core/src/OpenFin";
declare const fin: OpenFin.Fin<"window" | "view">;
declare const fdc3: any;

const CONTEXT = {
    type: 'fdc3.instrument',
    id: {
        ticker: 'AAPL'
    }
};

const setupListeners = async () => {
    const broadcastBtn: HTMLButtonElement = document.querySelector('#broadcast-btn');
    const contextInput: HTMLTextAreaElement= document.querySelector('#context-textarea');
    const raiseIntentBtn: HTMLButtonElement = document.querySelector('#raise-intent-btn');
    const intentInput: HTMLTextAreaElement= document.querySelector('#intent-textarea');
    
    await fdc3.addContextListener(null, (context, contextMetadata) => {
        contextInput.value = `context: ${JSON.stringify(context, null, 2)}\ncontextMetadata: ${JSON.stringify(contextMetadata, null, 2)}`;
    });
    
    await fdc3.addIntentListener('ViewChart', (context, contextMetadata) => {
        console.log('###### intent fired', context, contextMetadata);
        intentInput.value = `Handled 'ViewChart' intent with the following context and metadata:\ncontext: ${JSON.stringify(context, null, 2)}\ncontextMetadata: ${JSON.stringify(contextMetadata, null, 2)}`;
    });
    
    broadcastBtn.onclick = async () => {
        await fdc3.broadcast(CONTEXT);
    };
    
    raiseIntentBtn.onclick = async () => {
        const intentResolution = await fdc3.raiseIntent('ViewChart', CONTEXT);
    };
}

const setup = async () => {
    await setupListeners();
    const viewName = document.querySelector('#view-name');
    viewName.innerHTML = fin.me.identity.name;
};

setup();

