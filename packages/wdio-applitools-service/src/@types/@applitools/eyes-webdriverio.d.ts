/// <reference types="@applitools/visual-grid-client"/>
/// <reference types="../applitools-service"/>

declare module '@applitools/eyes-webdriverio';

type Region = Eyes.Check.Region | WebdriverIO.Element | string;
type Frame = WebdriverIO.Element | string;

interface TestResult {}

interface Eyes {
    new(serverUrl: string, isDisabled: boolean): Eyes;

    setServerUrl(value: string): void;
    setApiKey(value: string): void;
    setProxy(value: ProxySettings | string | boolean): void;

    open(driver: WebdriverIO.Browser, appName: string, testName: string, viewportSize?: { width: number, height: number }): Promise<WebdriverIO.Browser>;
    check(name: string, target: Target): Promise<boolean>;
    close(throwEx?: boolean): Promise<TestResult>;
    abortIfNotClosed(): Promise<any>;
}

interface Target {
    window(): Target;
    region(region: Region, frame: Frame): Target;
}
