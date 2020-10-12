/// <reference types="@applitools/visual-grid-client"/>

declare module '@applitools/eyes-webdriverio';

type Region = Eyes.Check.Region | WebdriverIO.Element | string;
type Frame = WebdriverIO.Element | string;

interface ProxyOptions {
    url: string | boolean;
    username: string;
    password: string;
    isHttpOnly: boolean;
}

interface Eyes {
    new(serverUrl: string, isDisabled: boolean): Eyes;

    setServerUrl(value: string): void;
    setApiKey(value: string): void;
    setProxy(value: ProxyOptions): void;

    open(driver: any, appName: string, testName: string, viewportSize?: { width: number, height: number }): Promise<any>;
    check(name: string, target: any): Promise<boolean>;
    close(throwEx?: boolean): Promise<any>;
    abortIfNotClosed(): any;
}

interface Target {
    window(): Target;
    region(region: Region, frame: Frame): Target;
}
