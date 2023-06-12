import { WebDriver, OpenFinProxy } from '@openfin/automation-helpers';
import { DesktopAgent } from "@finos/fdc3";

import { topMenu } from './Menus/topMenuItems'
const topMenuIns = new topMenu();



// declare var fin:any;

describe('FDC3', function() {
        const interop = 'Interop';

        it(`Switch to ${interop}`, async () => {
            await WebDriver.waitForWindow('title', interop, 5000);
            const title = await WebDriver.getTitle();
            console.log(title)
            expect(title).toBe(interop);
            //assert.(title,  healthCheckTitle);
        });

        it('validate runtime status and version', async () => {
            await WebDriver.sleep(5000)
            await topMenuIns.validateRuntimeStatus("32.114.76.8");
        });


        it('validate fdc3-open app - valid app', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const test = await fdc3Proxy.open({appId:'fdc3-client-one'});
            console.log(test);
        });

         it('validate fdc3-open app - invalid app', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const test = await fdc3Proxy.open({appId:'foo'});
             expect(test).toThrowError('AppNotFound');
        });

        it('validate fdc3-getInfo', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const test = await fdc3Proxy.getInfo()
            console.log(test);
            expect(test).not.toBeNull
        });

        it('validate fdc3-joinChannel', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const instrument = {
                                    type: 'fdc3.instrument',
                                    id: {
                                        ticker: 'AAPL'
                                    }
                                };
            await fdc3Proxy.joinUserChannel('red');
            await fdc3Proxy.broadcast(instrument);
            // const instrumentListener = await fdc3Proxy.addContextListener('fdc3.instrument', instrument=> { (console.log('test'))});
            // console.log(instrumentListener);
            // expect(instrumentListener).not.toBeNull
        });

        it('validate fdc3-joinChannel - No channel Found', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const test = await fdc3Proxy.joinUserChannel('foo');
            expect(test).toThrowError('NoChannelFound'); 
            
        });

    });
