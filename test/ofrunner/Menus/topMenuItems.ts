
import {  OpenFinSystem, WebDriver, OpenFinProxy } from '@openfin/automation-helpers';
class topMenu {

async validateRuntimeStatus(expectedRuntime: any) {
        await OpenFinSystem.waitForReady(10000);
        const fin = await OpenFinProxy.fin();
        const version = await fin.System.getVersion();
        expect(expectedRuntime).toBe(version);
};

async clickMinimizeWindow(){
    const toggleLock = await WebDriver.findElementById('minimize-button');
    toggleLock.click();
    await WebDriver.sleep(1000)
    await WebDriver.saveScreenshot()
    // await WebDriver.callMethod('Window.show', undefined, false);
    // await WebDriver.sleep(2000); 
}

}

export {topMenu}