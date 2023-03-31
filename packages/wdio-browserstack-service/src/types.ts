import type { Capabilities, Options } from '@wdio/types'
import type { Options as BSOptions } from 'browserstack-local'

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

export interface TestObservabilityOptions {
    buildName?: string,
    projectName?: string,
    buildTag?: string[],
    user?: string,
    key?: string
}

export interface BrowserstackConfig {
    /**
     *`buildIdentifier` is a unique id to differentiate every execution that gets appended to
     * buildName. Choose your buildIdentifier format from the available expressions:
     * ${BUILD_NUMBER} (Default): Generates an incremental counter with every execution
     * ${DATE_TIME}: Generates a Timestamp with every execution. Eg. 05-Nov-19:30
     */
     buildIdentifier?: string;
    /**
     * Set this to true to enable BrowserStack Test Observability which will collect test related data
     * (name, hierarchy, status, error stack trace, file name and hierarchy), test commands, etc.
     * and show all the data in a meaningful manner in BrowserStack Test Observability dashboards for faster test debugging and better insights.
     * @default true
     */
    testObservability?: boolean;
    /**
     * Set the Test Observability related config options under this key.
     * For e.g. buildName, projectName, BrowserStack access credentials, etc.
     */
    testObservabilityOptions?: TestObservabilityOptions;
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
    opts?: Partial<BSOptions>
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

/**
 * Observability types
 */
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
    examples?: string[]
}

export interface TestData {
    uuid?: string,
    type?: string,
    name?: string,
    scope?: string,
    scopes?: string[],
    identifier?: string,
    file_name?: string,
    vc_filepath?: string,
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
    integrations?: { [index: string]: IntegrationObject },
    hook_type?: string,
    hooks?: string[],
    meta?: TestMeta,
    tags?: string[]
}

export interface UserConfig {
    buildName?: string,
    projectName?: string,
    buildTag?: string,
    bstackServiceVersion?: string,
    buildIdentifier?: string
}

export interface UploadType {
    event_type: string,
    hook_run?: TestData,
    test_run?: TestData,
    logs?: any[]
}

export interface LaunchResponse {
    jwt: string,
    build_hashed_id: string,
    allow_screenshots?: boolean
}

interface IntegrationObject {
    capabilities?: Capabilities.Capabilities,
    session_id?: string
    browser?: string
    browser_version?: string
    platform?: string
    product?: string
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
