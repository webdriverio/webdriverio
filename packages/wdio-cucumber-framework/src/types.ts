import type { AsyncLocalStorage } from 'node:async_hooks'

import type { ITestCaseHookParameter, World } from '@cucumber/cucumber'
import type { Pickle, PickleStep, TestStep, Feature } from '@cucumber/messages'

import type { Frameworks } from '@wdio/types'

/**
 * Bidi-aware browser subset. These members are added at runtime by the
 * webdriverio package and are NOT declared on the minimal Browser stub
 * in @wdio/types. The cucumber-framework adapter does not import from
 * webdriverio (to avoid a circular dependency), so we declare the shape
 * we need here.
 */
export interface ParallelBrowser extends WebdriverIO.Browser {
    isBidi: boolean
    __parallelContextStore?: AsyncLocalStorage<string>
    __bidiCommandsEnabled?: boolean
    /** Set of framework-managed parallel contexts (see session/context.ts). */
    __parallelContexts?: Set<string>
    requestedCapabilities: Record<string, unknown>
    capabilities: Record<string, unknown>
    browsingContextCreate(params: { type: string; userContext?: string }): Promise<{ context: string }>
    browsingContextClose(params: { context: string }): Promise<void>
    browserCreateUserContext?(params: Record<string, never>): Promise<{ userContext: string }>
    browserRemoveUserContext?(params: { userContext: string }): Promise<void>
}

export type ParallelMode =
    /**
     * Each scenario runs in a window of the default user context. Cookies,
     * localStorage and service workers are shared across concurrently
     * running scenarios.
     */
    | 'contexts'
    /**
     * Each scenario runs in a window of its own BiDi user context (isolated
     * cookies, localStorage and service workers). Recommended for scenarios
     * touching auth or storage. Costs a fresh profile per scenario (e.g. a
     * login per scenario) and requires `browser.createUserContext`;
     * `browser.mock()` stays session-level and is not isolated per user context.
     */
    | 'userContexts'

export interface CucumberOptions {
    /**
     * Paths to where your feature files are located
     * @default []
     */
    paths?: string[];
    /**
     * Show full backtrace for errors.
     * @default false
     */
    backtrace?: boolean;
    /**
     * Prepare a test run but don't run it
     * @default false
     */
    dryRun?: boolean;
    /**
     * Explicitly call process.exit() after the test run
     * @default false
     */
    forceExit?: boolean;
    /**
     * Abort the run on first failure.
     * @default false
     */
    failFast?: boolean;
    /**
     * Name/path of formatter to use
     */
    format?: Array<string | [string, string?]>;
    /**
     * Options to be provided to formatters
     */
    formatOptions?: object;
    /**
     * Paths to where your support code is, for ESM
     */
    import?: string[];
    /**
     * The language you choose for Gherkin should be the same language your users and
     * domain experts use when they talk about the domain. Translating between two
     * languages should be avoided.
     * @see https://cucumber.io/docs/gherkin/reference/#spoken-languages
     * @default en
     */
    language?: string;
    /**
     * Only execute the scenarios with name matching the expression (repeatable).
     * @default []
     */
    name?: string[];
    /**
     * Switch between deterministic  and random feature execution. Either "defined",
     * "random" or "random:42" whereas 42 is the seed for randomization
     * @default defined
     */
    order?: 'defined' | 'random' | `random:${string}`;
    /**
     * Publish a report of your test run to https://reports.cucumber.io/
     */
    publish?: boolean;
    /**
     * Require files containing your step definitions before executing features.
     * You can also specify a glob to your step definitions.
     * @default []
     * @example `[path.join(__dirname, 'step-definitions', 'my-steps.js')]`
     */
    require?: string[];
    /**
     * Require modules prior to requiring any support files.
     * @default []
     * @example `['@babel/register']` or `[['@babel/register', { rootMode: 'upward', ignore: ['node_modules'] }]] or [() => { require('ts-node').register({ files: true }) }]`
     */
    requireModule?: string[];
    /**
     * Specify the number of times to retry failing test cases.
     * @default 0
     */
    retry?: number;
    /**
     * Only retries the features or scenarios with tags matching the expression (repeatable).
     * This option requires 'retry' to be specified.
     */
    retryTagFilter?: string;
    /**
     * Fail if there are any undefined or pending steps
     * @default false
     */
    strict?: boolean;
    /**
     * Only execute the features or scenarios with tags matching the expression.
     * Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.
     */
    tags?: string;
    /**
     * Parameters to be passed to your World
     */
    worldParameters?: unknown;
    /**
     * Timeout in milliseconds for step definitions.
     * @default 60000
     */
    timeout?: number;
    /**
     * Enable this to make webdriver.io behave as if scenarios
     * and not steps were the tests.
     * @default false
     */
    scenarioLevelReporter?: boolean;
    /**
     * Add cucumber tags to feature or scenario name
     * @default false
     */
    tagsInTitle?: boolean;
    /**
     * Treat undefined definitions as warnings.
     * Please note that this is a @wdio/cucumber-framework specific option and
     * not recognized by cucumber-js itself.
     * @default false
     */
    ignoreUndefinedDefinitions?: boolean;
    /**
     * Treat ambiguous definitions as errors.
     *
     * Please note that this is a @wdio/cucumber-framework specific option
     * and not recognized by cucumber-js itself.
     * @default false
     */
    failAmbiguousDefinitions?: boolean;
    /**
     * Profiles from which to include configuration.
     * @default []
     */
    profiles?: string[];
    /**
     * Path to load configuration file from, or `false` to skip.
     * Not setting this results in undefined which ends up using default cucumber config files
     * @default undefined
     */
    file?: string | false | undefined;
    /**
     * Enable parallel scenario execution within a spec file. When set to
     * `'contexts'` or `'userContexts'`, each scenario runs simultaneously in
     * its own browsing context (window); `'userContexts'` additionally isolates
     * storage per scenario. Requires a WebDriver Bidi session AND the
     * `wdio:experimentalBiDiCommands: true` capability — if either is
     * missing, parallel mode falls back to sequential execution with a
     * warning.
     *
     * That capability is not parallel-specific: when set, the webdriverio
     * package swaps element-command implementations for ALL BiDi tests.
     * Notable behavioral differences: `addValue`/`clearValue` dispatch
     * untrusted synthetic DOM events (no trusted key events), `getText`
     * uses `innerText`, `getAttribute` normalizes property/attribute
     * resolution, and `click` is driven via the Actions API.
     *
     * Constraints in parallel mode:
     * - No window management: `switchToWindow`, `switchToParentFrame`,
     *   `refresh` and `closeWindow` throw inside a parallel scenario.
     * - `'contexts'` shares cookies and storage across all browsing contexts;
     *   `'userContexts'` isolates them.
     * - `beforeFeature`/`afterFeature` (BeforeAll/AfterAll) run once per
     *   test run, not per feature.
     * - Do not fire-and-forget timers that outlive the test: the context
     *   is closed as soon as the scenario finishes.
     *
     * @default undefined (sequential execution)
     */
    parallelMode?: ParallelMode
    /**
     * Maximum number of browsing contexts (windows) to use in parallel.
     * Runs a pool of this many slots, each running one scenario at a time in its
     * own window. A slot opens its next window while its scenario runs, so up to
     * twice this many windows can be open briefly.
     * @default os.cpus().length
     */
    maxParallelContexts?: number
    /**
     * Snippet interface used when generating step definition snippets for
     * undefined steps in parallel mode.
     * @default 'synchronous'
     */
    snippetInterface?: 'async-await' | 'callback' | 'promise' | 'synchronous'
    /**
     * Snippet syntax (path to a custom snippet syntax module) used when
     * generating step definition snippets in parallel mode.
     */
    snippetSyntax?: string
}

export interface HookParams {
    uri?: string | null,
    feature?: Feature | null,
    scenario?: Pickle,
    step?: PickleStep | TestStep
}

/**
 * The pickle step needs to have a keyword for the reporters, otherwise reporters like
 * the allure or spec reporter won't show the `Given|When|Then` words
 */
export interface ReporterStep extends PickleStep {
    keyword?: string
}

/**
 * The pickle scenario needs to have a rule for the reporters, otherwise reporters like
 * the allure or spec reporter won't show the rule
 */
export interface ReporterScenario extends Pickle {
    rule?: string
}

export interface HookFunctionExtension {
    /**
     *
     * Runs before a Cucumber Feature.
     * @param uri      path to feature file
     * @param feature  Cucumber feature object
     */
    beforeFeature?(uri: string, feature: Feature): void | Promise<void>;

    /**
     *
     * Runs before a Cucumber Scenario.
     * @param world     world object containing information on pickle and test step
     * @param context   Cucumber World object
     */
    beforeScenario?(world: ITestCaseHookParameter, context: World): void | Promise<void>;

    /**
     *
     * Runs before a Cucumber Step.
     * @param step     step data
     * @param scenario scenario data
     * @param context  Cucumber World object
     */
    beforeStep?(step: PickleStep, scenario: Pickle, context: World): void | Promise<void>;

    /**
     *
     * Runs after a Cucumber Step.
     * @param step            step data
     * @param scenario        scenario data
     * @param result          result object containing
     * @param result.passed   true if scenario has passed
     * @param result.error    error stack if scenario failed
     * @param result.duration duration of scenario in milliseconds
     * @param context         Cucumber World object
     */
    afterStep?(step: PickleStep, scenario: Pickle, result: Frameworks.PickleResult, context: World): void | Promise<void>;

    /**
     *
     * Runs after a Cucumber Scenario.
     * @param world             world object containing information on pickle and test step
     * @param result            result object containing
     * @param result.passed     true if scenario has passed
     * @param result.error      error stack if scenario failed
     * @param result.duration   duration of scenario in milliseconds
     * @param context           Cucumber World object
     */
    afterScenario?(world: ITestCaseHookParameter, result: Frameworks.PickleResult, context: World): void | Promise<void>;

    /**
     *
     * Runs after a Cucumber Feature.
     * @param uri      path to feature file
     * @param feature  Cucumber feature object
     */
    afterFeature?(uri: string, feature: Feature): void | Promise<void>;
}

export interface StepDefinitionOptions {
    retry: number;
}

export interface TestHookDefinitionConfig {
    code: Function;
    line: number;
    options: unknown;
    uri: string;
}

export interface Payload {
    cid?: string
    uid?: string
    specs?: string[]
    error?: Error
    parent?: unknown
    title?: string
    fullTitle?: string
    passed?: boolean
    contextId?: string
}
