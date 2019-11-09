/// <reference types="@applitools/visual-grid-client"/>

declare namespace WebdriverIO {
    interface Config {
        applitoolsKey?: string;
        applitoolsServerUrl?: string;
        applitools?: {
            viewport: {
                width: number;
                height: number;
            };
        };
    }

    interface Browser {
        takeSnapshot(title: string): void;
        takeRegionSnapshot(
            title: string,
            region: Eyes.Check.Region | WebdriverIO.Element | string,
            frame?: WebdriverIO.Element | string
        ): void;
    }
}

declare module "@wdio/applitools-service" {
    export default WebdriverIO;
}
