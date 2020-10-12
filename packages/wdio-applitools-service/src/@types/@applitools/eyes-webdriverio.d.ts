/// <reference types="@applitools/eyes-sdk-core"/>

declare module '@applitools/eyes-webdriverio';

interface Eyes {
    new(serverUrl: string, isDisabled: boolean): Eyes;

    setServerUrl(value: string): void;
    setApiKey(value: string): void;
    setProxy(value: ProxySettings): void;
}
