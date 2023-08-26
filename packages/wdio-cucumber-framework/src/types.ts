import type { ITestCaseHookParameter } from '@cucumber/cucumber'
import type { Pickle, PickleStep, TestStep, Feature } from '@cucumber/messages'

import type { Frameworks } from '@wdio/types'

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
    format?: string[];
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
    order?: string;
    /**
     * Run tests in parallel with the given number of worker processes
     */
    parallel?: number;
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
    worldParameters?: any;
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
    beforeFeature?(uri: string, feature: Feature): void;

    /**
     *
     * Runs before a Cucumber Scenario.
     * @param world     world object containing information on pickle and test step
     * @param context   Cucumber World object
     */
    beforeScenario?(world: ITestCaseHookParameter, context: Object): void;

    /**
     *
     * Runs before a Cucumber Step.
     * @param step     step data
     * @param scenario scenario data
     * @param context  Cucumber World object
     */
    beforeStep?(step: PickleStep, scenario: Pickle, context: Object): void;

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
    afterStep?(step: PickleStep, scenario: Pickle, result: Frameworks.PickleResult, context: Object): void;

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
    afterScenario?(world: ITestCaseHookParameter, result: Frameworks.PickleResult, context: Object): void;

    /**
     *
     * Runs after a Cucumber Feature.
     * @param uri      path to feature file
     * @param feature  Cucumber feature object
     */
    afterFeature?(uri: string, feature: Feature): void;
}
