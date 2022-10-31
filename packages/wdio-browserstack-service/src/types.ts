import type { Capabilities, Options } from '@wdio/types'

export interface SessionResponse {
    // eslint-disable-next-line camelcase
    automation_session: {
        // eslint-disable-next-line camelcase
        browser_url: string
    }
}

export type MultiRemoteAction = (sessionId: string, browserName?: string) => Promise<any>;

export type AppConfig = {
    id?: string,
    path?: string,
    custom_id?: string,
    shareable_id?: string
}

export interface AppUploadResponse {
    app_url?: string,
    custom_id?: string,
    shareable_id?: string
}

export interface App {
    app?: string,
    customId?: string
}

export interface BrowserstackConfig {
    /**
     * Set this with app file path present locally on your device or
     * app hashed id returned after uploading app to BrowserStack or
     * custom_id, sharable_id of the uploaded app
     * @default undefined
     */
    app?: string | AppConfig;
    /**
     * Enable routing connections from BrowserStack cloud through your computer.
     * You will also need to set `browserstack.local` to true in browser capabilities.
     * @default false
     */
    browserstackLocal?: boolean;
    /**
     * Kill the BrowserStack Local process on complete, without waiting for the
     * BrowserStack Local stop callback to be called.
     *
     * __This is experimental and should not be used by all.__
     * @default false
     */
    forcedStop?: boolean;
    /**
     * BrowserStack Local options. For more details check out the
     * [`browserstack-local`](https://www.npmjs.com/package/browserstack-local#arguments) docs.
     *
     * @example
     * ```js
     * {
     *   localIdentifier: 'some-identifier'
     * }
     * ```
     * @default {}
     */
    opts?: Partial<import('browserstack-local').Options>
    /**
     * Cucumber only. Set the BrowserStack Automate session name to the Scenario name if only a single Scenario ran.
     * Useful when running in parallel with [wdio-cucumber-parallel-execution](https://github.com/SimitTomar/wdio-cucumber-parallel-execution).
     * @default false
     */
    preferScenarioName?: boolean;
    /**
     * Customize the BrowserStack Automate session name format.
     * @default undefined
     */
    sessionNameFormat?: (
        config: Options.Testrunner,
        capabilities: Capabilities.RemoteCapability,
        suiteTitle: string,
        testTitle?: string
    ) => string
    /**
     * Mocha only. Do not append the test title to the BrowserStack Automate session name.
     * @default false
     */
    sessionNameOmitTestTitle?: boolean;
    /**
     * Mocha only. Prepend the top level suite title to the BrowserStack Automate session name.
     * @default false
     */
    sessionNamePrependTopLevelSuiteTitle?: boolean;
    /**
     * Automatically set the BrowserStack Automate session name.
     * @default true
     */
    setSessionName?: boolean
    /**
     * Automatically set the BrowserStack Automate session status (passed/failed).
     * @default true
     */
    setSessionStatus?: boolean
}
