import { Capabilities } from '@wdio/types';

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
     * Set this to true to enable BrowserStack Test Observability which will collect test related data
     * (name, hierarchy, status, error stack trace, file name and hierarchy), test commands, etc.
     * and show all the data in a meaningful manner in BrowserStack Test Observability dashboards for faster test debugging and better insights.
     */
    testObservability?: boolean;
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

export interface PlatformMeta {
    sessionId?: string,
    browserName?: string,
    browserVersion?: string,
    platformName?: string,
    caps?: Capabilities.Capabilities,
    product?: string
}

export interface TestMeta {
    uuid?: string,
    startedAt?: string,
    finishedAt?: string,
    steps?: StepData[],
    feature?: { name: string, path?: string, description: string | null },
    scenario?: { name: string },
}

export interface TestData {
    uuid?: string,
    type?: string,
    name?: string,
    scope?: string,
    scopes?: string[],
    identifier?: string,
    file_name?: string,
    location?: string,
    started_at?: string,
    finished_at?: string,
    framework?: string,
    body?: TestCodeBody,
    result?: string,
    failure?: Failure[],
    failure_reason?: string,
    failure_type?: string | null,
    retries?: { limit: number, attempts: number },
    duration_in_ms?: number,
    integrations?: { [index: string]: any },
    hook_type?: string,
    hooks?: string[],
    meta?: TestMeta,
    tags?: string[]
}

export interface UserConfig {
    username?: string,
    password?: string
    buildName?: string,
    projectName?: string,
    buildTag?: string
}

interface TestCodeBody {
    lang: string,
    code?: string | null
}

interface StepData {
    id?: string,
    text?: string,
    keyword?: string,
    started_at?: string,
    finished_at?: string,
    result?: string,
    duration?: number,
    failure?: string
}

interface Failure {
    backtrace: string[]
}
