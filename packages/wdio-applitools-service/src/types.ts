/// <reference types="webdriverio/async" />

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
    eyesProxy?: ProxySettings;
}

export type Region = {
    top: number
    left: number
    width: number
    height: number
} | Element | string;
export type Frame = Element | string;
