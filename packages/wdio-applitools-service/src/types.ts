import { Browser, Element } from 'webdriverio'

interface ProxySettings {
    url: string | boolean;
    username: string;
    password: string;
    isHttpOnly: boolean;
}

export interface ApplitoolsConfig {
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

export interface ApplitoolsBrowser extends Browser {
    takeSnapshot(title: string): void;
    takeRegionSnapshot(
        title: string,
        region: Eyes.Check.Region | Element | string,
        frame?: Element | string
    ): void;
}

export interface ApplitoolsBrowserAsync extends Browser {
    takeSnapshot(title: string): Promise<void>;
    takeRegionSnapshot(
        title: string,
        region: Eyes.Check.Region | Element | string,
        frame?: Element | string
    ): Promise<void>;
}
