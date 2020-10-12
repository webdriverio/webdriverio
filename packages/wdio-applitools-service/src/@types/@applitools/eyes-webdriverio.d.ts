/// <reference types="@applitools/visual-grid-client"/>
/// <reference types="@applitools/eyes-sdk-core"/>

declare module '@applitools/eyes-webdriverio';

type Region = Eyes.Check.Region | WebdriverIO.Element | string;
type Frame = WebdriverIO.Element | string;

interface Eyes {
    new(serverUrl: string, isDisabled: boolean): Eyes;

    setServerUrl(value: string): void;
    setApiKey(value: string): void;
    setProxy(value: ProxySettings): void;

    open(driver: WebdriverIO, appName: string, testName: string, viewportSize?: { width: number, height: number }): Promise<WebdriverIO>;
    check(name: string, target: any): Promise<boolean>;
    close(throwEx?: boolean): Promise<any>;
    abortIfNotClosed(): any;
}

interface Target {
    window(): Target;
    region(region: Region, frame: Frame): Target;
}
