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
            await topMenuIns.validateRuntimeStatus("33.116.77.11");
        });


        it('validate fdc3-open app - valid app', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.open({appId:'fdc3-client-one'});
            console.log(response);
            expect(response).toBeDefined;
            expect(response.appId).toBe('fdc3-client-one');
            expect(response.instanceId).toBeDefined;
        });

         it('validate fdc3-open app - invalid app', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.open({appId:'foo'});
            expect(response).toBeUndefined;
             expect(response).toThrowError('AppNotFound');
        });

        it('validate fdc3-getInfo', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.getInfo()
            console.log(response);
            expect(response).toBeDefined;
            expect(response.appMetadata.appId).toBe('fdc3-client-one')
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
            // const instrumentListener = await fdc3Proxy.addContextListener('fdc3.instrument', instrument=> { (console.log('response'))});
            // console.log(instrumentListener);
            // expect(instrumentListener).not.toBeNull
        });

        it('validate fdc3-joinChannel - No channel Found', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.joinUserChannel('foo');
            expect(response).toBeUndefined;
            //expect(response).toThrowError('NoChannelFound'); 
            
        });

        it('validate fdc3-getUserChannels', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.getUserChannels();
            console.log(response);
            expect(response.length).toBe(6)
        });

        
        it('validate fdc3-getCurrentContext', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const instrument = {
                type: 'fdc3.instrument',
                id: {
                    ticker: 'AAPL'
                }
            };
            await fdc3Proxy.joinUserChannel('purple');
            await fdc3Proxy.broadcast(instrument);
            const currentChannel = await fdc3Proxy.getCurrentChannel();
            const currentContext = await currentChannel.getCurrentContext();
            expect(currentContext).toBeDefined;
            expect(currentContext.id.ticker).toEqual('AAPL');
            console.log(currentContext);
        });

        it('validate fdc3-getCurrentContext with contextType', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const contact = {
                type: "fdc3.contact",
                name: "Poonam G",
                id: {
                    email: "poonam.g@openfin.co"
                }
            }
            await fdc3Proxy.joinUserChannel('yellow');
            await fdc3Proxy.broadcast(contact);
            const currentChannel = await fdc3Proxy.getCurrentChannel();
            const currentContext = await currentChannel.getCurrentContext('fdc3.contact');
            console.log(currentContext);
            expect(currentContext).toBeDefined;
            expect(currentContext.id.email).toEqual('poonam.g@openfin.co');
        });

        it('validate fdc3-getCurrentContext returns null', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            await fdc3Proxy.joinUserChannel('green');
            const currentChannel = await fdc3Proxy.getCurrentChannel();
            const currentContext = await currentChannel.getCurrentContext();
            expect(currentContext).toBeNull;
            console.log(currentContext);
        });

        it('validate fdc3-getCurrentContext, returns null for invalid context', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const instrument = {
                type: 'fdc3.instrument',
                id: {
                    ticker: 'AAPL'
                }
            };
            await fdc3Proxy.joinUserChannel('purple');
            await fdc3Proxy.broadcast(instrument);
            const currentChannel = await fdc3Proxy.getCurrentChannel();
            const currentContext = await currentChannel.getCurrentContext('fdc3.contact');
            expect(currentContext).toBeNull;
            console.log(currentContext);
        });

        it.skip('should receive the expected context when emitted', async () => {
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const expectedContext = { type: 'fdc3.instrument',
            id: {
                ticker: 'AAPL'
            } };
            const contextListener = () => {
                console.log('test');
            };
            await fdc3Proxy.addContextListener('fdc3.instrument', contextListener);
            await fdc3Proxy.broadcast(expectedContext);
          });

          it('validate fdc3-findInstances', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findInstances({appId:'fdc3-client-one'});
            console.log(response);
            expect(response).toBeDefined;
            expect(response.length).toBe(2)
        });

        it('validate fdc3-findInstances - returns empty array', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findInstances({appId:'fdc3-client-three'});
            console.log(response);
            expect(response).toBeNull;
        });

        it('validate fdc3-getAppMetadata  - Null', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.getAppMetadata({appId:'fdc3-client-three'})
            console.log(response);
            expect(response).toBeNull;
        });

        it('validate fdc3-getAppMetadata  - fdc3-client-one', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.getAppMetadata({appId:'fdc3-client-one'})
            console.log(response);
            expect(response).toBeDefined;
            expect(response.appId).toBe('fdc3-client-one');
            expect(response.title).toBe('FDC3 QA - Client App');

        });

        it('validate fdc3-findIntent  - View Chart', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findIntent('ViewChart')
            console.log(response);
            expect(response).toBeDefined;
            expect(response.apps.length).toBeGreaterThanOrEqual(3)

        });

        it('validate fdc3-findIntent  - Start Call', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findIntent('StartCall')
            console.log(response);
            expect(response).toBeDefined;
            expect(response.apps.length).toBeGreaterThanOrEqual(3)

        });

        it('validate fdc3-findIntent  - View News', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findIntent('ViewNews')
            console.log(response);
            expect(response).toBeDefined;
            expect(response.apps.length).toBeGreaterThanOrEqual(3)

        });

        it('validate fdc3-findIntent  - Start Call and context', async () => {
            const contact = {
                type: "fdc3.contact",
                name: "Jane Doe",
                id: {
                    email: "jane.doe@mail.com"
                }
            }
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findIntent('StartCall', contact )
            console.log(response);
            expect(response).toBeDefined;
            expect(response.apps.length).toBeGreaterThanOrEqual(3)

        });

        it('validate fdc3-findIntent  - Start Call, context and resulttype', async () => {
            const contact = {
                type: "fdc3.contact",
                name: "Jane Doe",
                id: {
                    email: "jane.doe@mail.com"
                }
            }
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findIntent('StartCall', contact, "channel<fdc3.Contact>" )
            console.log(response);
            expect(response).toBeDefined;
            expect(response.apps.length).toBeGreaterThanOrEqual(3)

        });

        it('validate fdc3-findIntent  - Start Call, context and error resulttype', async () => {
            const contact = {
                type: "fdc3.contact",
                name: "Jane Doe",
                id: {
                    email: "jane.doe@mail.com"
                }
            }
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findIntent('foo', contact, "foo<fdc3.foo>" )
            console.log('validate fdc3-findIntent  - Start Call, context and error resulttype',  response);
            expect(response).toBeUndefined;

        });

        it('validate fdc3-findIntentsByContext  - fdc3.instrument', async () => {
            const instrument = {
                type: 'fdc3.instrument',
                id: {
                    ticker: 'AAPL'
                }
            };
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findIntentsByContext(instrument)
            console.log(response);
            expect(response).toBeDefined;
            expect(response.length).toBeGreaterThanOrEqual(3)
        });

        it('validate fdc3-findIntentsByContext  - fdc3.contact', async () => {
            const contact = {
                type: "fdc3.contact",
                name: "Poonam G",
                id: {
                    email: "poonam.g@openfin.co"
                }
            };
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.findIntentsByContext(contact)
            console.log(response);
            expect(response).toBeDefined;
            expect(response.length).toBeGreaterThanOrEqual(3)
        });
        

        it('validate fdc3-getOrCreateChannel is type app', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.getOrCreateChannel('foo')
            console.log(response);
            expect(response).toBeDefined;
            expect(response.type).toBe('app')
        });

        it('validate fdc3-getOrCreateChannel is type app and broadcast on app channel', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const response = await fdc3Proxy.getOrCreateChannel('foo')
            const instrument = {
                type: "fdc3.instrument",
                name: "Microsoft",
                id: {
                    ticker: "MSFT",
                    RIC: "MSFT.OQ",
                    ISIN: "US5949181045"
                },
                market: {
                    MIC: "XNAS"
                }
            };
            await fdc3Proxy.broadcast(instrument)
            console.log(response);
            expect(response).toBeDefined;
            expect(response.type).toBe('app')
        });


        it('validate fdc3-getCurrentChannel on a view', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            await fdc3Proxy.joinUserChannel('purple')
            const response = fdc3Proxy.getCurrentChannel();
            console.log(response);
            expect(response).toBeDefined;
            expect((await response).id).toBe('purple')
        });


        it('validate fdc3-leaveCurrentChannel and  braodcast', async () => {
            const instrument = {
                type: "fdc3.instrument",
                name: "Microsoft",
                id: {
                    ticker: "MSFT",
                    RIC: "MSFT.OQ",
                    ISIN: "US5949181045"
                },
                market: {
                    MIC: "XNAS"
                }
            };
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            await fdc3Proxy.joinUserChannel('orange')
            await fdc3Proxy.leaveCurrentChannel();
            const response = await fdc3Proxy.broadcast(instrument)
            console.log(response);
            expect(response).toBeUndefined;
        });

        it('validate fdc3-leaveCurrentChannel and getCurrentChannel returns null', async () => {
            await webDriver.switchToWindow("title", "Client");
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            await fdc3Proxy.joinUserChannel('orange')
            await fdc3Proxy.leaveCurrentChannel();
            const response = fdc3Proxy.getCurrentChannel();
            console.log(response);
            expect(response).toBeNull;
        });

        it.skip('validate fdc3-raiseIntent-simple', async () => {
            await webDriver.switchToWindow("title", "Client");
            //const fin = await OpenFinProxy.fin();
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const instrument = {
                type: "fdc3.instrument",
                name: "Microsoft",
                id: {
                    ticker: "MSFT",
                    RIC: "MSFT.OQ",
                    ISIN: "US5949181045"
                },
                market: {
                    MIC: "XNAS"
                }
            };
            // const fin = await OpenFinProxy.fin();
            // const viewId = fin.me.identity;
          
            //let wins = await WebDriver.getWindows();
            
            const response =  fdc3Proxy.raiseIntent('ViewChart', instrument)
            await WebDriver.switchToWindow("identityString", [/picker-internal-generated-window(.*)/, "fdc3-qa"]);
            const getelem = await WebDriver.findElementById('picker-okay-button')
            await getelem.click();
            await WebDriver.sleep(7000)
            let wins = await WebDriver.getWindows();
            const winslen = (await WebDriver.getWindows());
            console.log(winslen)
            for (const win of wins) {
                
                if (win.identity!== undefined)
                {
                    if (win.identity.name.includes("picker-internal-generated-window") )
                    {
                        console.log(win);
                        
                        await WebDriver.switchToWindow('handle', win.handle);
                        const getelem = await WebDriver.findElementById('picker-okay-button')
                        await getelem.click();
                    }
                }
            };
            expect(response).toBeDefined;
            console.log(response);


        });

        it.skip('validate fdc3-raiseIntent-simple', async () => {
            await webDriver.switchToWindow("title", "Client");
            //const fin = await OpenFinProxy.fin();
            const fdc3Proxy = await OpenFinProxy.build<DesktopAgent>("fdc3", []);
            const instrument = {
                type: "fdc3.instrument",
                name: "Microsoft",
                id: {
                    ticker: "MSFT",
                    RIC: "MSFT.OQ",
                    ISIN: "US5949181045"
                },
                market: {
                    MIC: "XNAS"
                }
            };
            // const fin = await OpenFinProxy.fin();
            // const viewId = fin.me.identity;
          
            //let wins = await WebDriver.getWindows();
            
             const intentResolution  =  fdc3Proxy.raiseIntentForContext(instrument);
            // await WebDriver.switchToWindow("identityString", [/picker-internal-generated-window(.*)/, "fdc3-qa"]);
            // const getelem = await WebDriver.findElementById('picker-okay-button')
            // await getelem.click();
            // await WebDriver.sleep(7000)
            let wins = await WebDriver.getWindows();
            const winslen = (await WebDriver.getWindows());
            console.log(winslen)
            for (const win of wins) {
                
                if (win.identity!== undefined)
                {
                    if (win.identity.name.includes("picker-internal-generated-window") )
                    {
                        console.log(win);
                        
                        await WebDriver.switchToWindow('handle', win.handle);
                        const getelem = await WebDriver.findElementById('picker-okay-button')
                        await getelem.click();
                    }
                }
            };
            expect(intentResolution).toBeDefined;
            console.log(intentResolution);


        });


       

    });
