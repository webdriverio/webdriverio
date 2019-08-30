/// <reference types="node"/>
/// <reference types="webdriver"/>

declare namespace DevTools {
    interface ClientOptions extends WebDriver.ClientOptions {
        isDevTools: boolean;
        getPuppeteer: (...args: any[]) => any;
    }

    function newSession(
        options?: WebDriver.Options,
        modifier?: (...args: any[]) => any,
        proto?: object,
        commandWrapper?: (commandName: string, fn: (...args: any[]) => any) => any
    ): Promise<Client>;

    function reloadSession(
        instance: Client
    ): Promise<Client>;

    // generated typings
    // ... insert here ...
}

declare module "devtools" {
    export default DevTools;
}
