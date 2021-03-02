export interface SessionResponse {
    // eslint-disable-next-line camelcase
    automation_session: {
        // eslint-disable-next-line camelcase
        browser_url: string
    }
}

export type MultiRemoteAction = (sessionId: string, browserName?: string) => Promise<any>;

export interface BrowserstackConfig {
    /**
     * Set this to true to enable routing connections from Browserstack cloud through your computer.
     * You will also need to set `browserstack.local` to true in browser capabilities.
     */
    browserstackLocal?: boolean;
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
}
