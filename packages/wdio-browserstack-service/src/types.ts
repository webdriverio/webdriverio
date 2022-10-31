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
     * Set this to true to enable routing connections from Browserstack cloud through your computer.
     * You will also need to set `browserstack.local` to true in browser capabilities.
     */
    browserstackLocal?: boolean;
    /**
     * Set this with app file path present locally on your device or
     * app hashed id returned after uploading app to Browserstack or
     * custom_id, sharable_id of the uploaded app
     */
    app?: string | AppConfig;
    /**
     * Cucumber only. Set this to true to enable updating the session name to the Scenario name if only
     * a single Scenario was ran. Useful when running in parallel
     * with [wdio-cucumber-parallel-execution](https://github.com/SimitTomar/wdio-cucumber-parallel-execution).
     */
    preferScenarioName?: boolean;
    /**
     * Set this to true to kill the browserstack process on complete, without waiting for the
     * browserstack stop callback to be called. This is experimental and should not be used by all.
     */
    forcedStop?: boolean;
    /**
     * Set this to true to only use the suite title(s) for setting the session name.
     * @default false
     */
    omitTestTitle?: boolean;
    /**
     * Set this to true to prepend the top level suite title to the session name.
     * @default false
     */
    prependTopLevelSuiteTitle?: boolean;
    /**
     * Specified optional will be passed down to BrowserstackLocal. For more details check out the
     * [`browserstack-local`](https://www.npmjs.com/package/browserstack-local#arguments) docs.
     *
     * @example
     * ```js
     * {
     *   localIdentifier: 'some-identifier'
     * }
     * ```
     */
    opts?: Partial<import('browserstack-local').Options>
    /**
     * Dynamically control the name of the session in Browserstack.
     */
    setSessionName?: (
        config: Options.Testrunner,
        capabilities: Capabilities.RemoteCapability,
        suiteTitle: string,
        testTitle?: string
    ) => string
}
