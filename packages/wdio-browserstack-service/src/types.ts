import { GotRequestFunction } from 'got'

export type Capabilities = WebDriver.Capabilities & WebdriverIO.MultiRemoteCapabilities;

export type Browser = WebdriverIO.BrowserObject & WebdriverIO.MultiRemoteBrowserObject;

export type Context = any;

export type MultiRemoteAction = (sessionId: string, browserName?: string) => ReturnType<GotRequestFunction> | Promise<void>;

export interface Feature {
    document: {
        feature: {
            name: string;
        }
    }
}

export interface Pickle {
    name: string;
}

export interface SessionResponse {
    // eslint-disable-next-line camelcase
    automation_session: {
        // eslint-disable-next-line camelcase
        browser_url: string
    }
}
