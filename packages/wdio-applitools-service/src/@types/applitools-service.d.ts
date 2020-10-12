/// <reference types="webdriverio/webdriverio"/>
/// <reference types="@applitools/visual-grid-client"/>

declare module WebdriverIO {
    interface ServiceOption extends ApplitoolsConfig {}
    interface Browser extends ApplitoolsBrowser {}
}

declare module NodeJS {
    interface Global {
        browser: WebdriverIO.Browser;
    }
}

interface ApplitoolsConfig {
    /**
     * Applitools API key to be used. Can be passed via wdio config or via environment
     * variable `APPLITOOLS_KEY`
     */
    key?: string;
    /**
     * Applitools server URL to be used.
     */
    serverUrl?: string;
    /**
     * Viewport with which the screenshots should be taken.
     */
    viewport?: {
        width?: number;
        height?: number;
    };
    /**
     * Use proxy for http/https connections with Applitools.
     */
    proxy?: ProxySettings;
}

interface ApplitoolsBrowser {
    takeSnapshot(title: string): void;
    takeRegionSnapshot(
        title: string,
        region: Eyes.Check.Region | WebdriverIO.Element | string,
        frame?: WebdriverIO.Element | string
    ): void;
}

interface ApplitoolsBrowserAsync {
    takeSnapshot(title: string): Promise<void>;
    takeRegionSnapshot(
        title: string,
        region: Eyes.Check.Region | WebdriverIO.Element | string,
        frame?: WebdriverIO.Element | string
    ): Promise<void>;
}
