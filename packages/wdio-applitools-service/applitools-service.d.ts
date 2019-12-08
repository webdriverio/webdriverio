/// <reference types="@applitools/visual-grid-client"/>

declare module WebdriverIOAsync {
    interface Config extends ApplitoolsConfig {}
    interface Browser extends ApplitoolsBrowserAsync {}
}

declare module WebdriverIO {
    interface Config extends ApplitoolsConfig {}
    interface Browser extends ApplitoolsBrowser {}
}

interface ApplitoolsConfig {
    applitoolsKey?: string;
    applitoolsServerUrl?: string;
    applitools?: {
<<<<<<< Updated upstream
        key?: string;
        serverUrl?: string;
=======
>>>>>>> Stashed changes
        viewport?: {
            width: number;
            height: number;
        };
<<<<<<< Updated upstream
        proxy?: {
            url: string;
            username?: string;
            password?: string;
            isHttpOnly?: boolean;
        }
=======
>>>>>>> Stashed changes
    };
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
