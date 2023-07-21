import type { ITestCaseHookParameter } from '@cucumber/cucumber'
import type { Pickle, PickleStep, TestStep, Feature } from '@cucumber/messages'

import type { Capabilities, Frameworks } from '@wdio/types'

export interface CucumberOptions {
    /**
     * Show full backtrace for errors.
     * @default true
     */
    backtrace?: boolean
    /**
     * Require modules prior to requiring any support files.
     * @default []
     * @example `['@babel/register']` or `[['@babel/register', { rootMode: 'upward', ignore: ['node_modules'] }]] or [() => { require('ts-node').register({ files: true }) }]`
     */
    requireModule?: string[] | [string, Record<string, unknown>][] | [() => void]
    /**
     * Treat ambiguous definitions as errors.
     *
     * Please note that this is a @wdio/cucumber-framework specific option
     * and not recognized by cucumber-js itself.
     * @default false
     */
    failAmbiguousDefinitions?: boolean
    /**
     * Abort the run on first failure.
     * @default false
     */
    failFast?: boolean
    /**
     * Treat undefined definitions as warnings.
     * Please note that this is a @wdio/cucumber-framework specific option and
     * not recognized by cucumber-js itself.
     * @default false
     */
    ignoreUndefinedDefinitions?: boolean
    /**
     * Only execute the scenarios with name matching the expression (repeatable).
     * @default []
     */
    names?: (string|RegExp)[]
    /**
     * Require files containing your step definitions before executing features.
     * You can also specify a glob to your step definitions.
     * @default []
     * @example `[path.join(__dirname, 'step-definitions', 'my-steps.js')]`
     */
    require?: string[]
    /**
     * Specify a custom snippet syntax.
     */
    snippetSyntax?: string
    /**
     * Hide step definition snippets for pending steps.
     * @default true
     */
    snippets?: boolean
    /**
     * Hide source uris.
     * @default true
     */
    source?: boolean
    /**
     * Fail if there are any undefined or pending steps
     * @default false
     */
    strict?: boolean
    /**
     * Only execute the features or scenarios with tags matching the expression.
     * Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.
     */
    tagExpression?: string
    /**
     * Add cucumber tags to feature or scenario name
     * @default false
     */
    tagsInTitle?: boolean
    /**
     * Timeout in milliseconds for step definitions.
     * @default 30000
     */
    timeout?: number
    /**
     * Specify the number of times to retry failing test cases.
     * @default 0
     */
    retry?: number
    /**
     * Only retries the features or scenarios with tags matching the expression (repeatable).
     * This option requires 'retry' to be specified.
     */
    retryTagFilter?: RegExp | string
    /**
     * Enable this to make webdriver.io behave as if scenarios
     * and not steps were the tests.
     * @default false
     */
    scenarioLevelReporter?: boolean
    /**
     * Switch between deterministic  and random feature execution. Either "defined",
     * "random" or "random:42" whereas 42 is the seed for randomization
     */
    order?: string
    /**
     * The language you choose for Gherkin should be the same language your users and
     * domain experts use when they talk about the domain. Translating between two
     * languages should be avoided.
     * @see https://cucumber.io/docs/gherkin/reference/#spoken-languages
     */
    featureDefaultLanguage?: string
}

export interface ReporterOptions {
    capabilities: Capabilities.RemoteCapability
    ignoreUndefinedDefinitions: boolean
    failAmbiguousDefinitions: boolean
    tagsInTitle: boolean
    scenarioLevelReporter: boolean
}

export interface TestHookDefinitionConfig {
    code: Function;
    line: number;
    options: any;
    uri: string;
}

export interface HookParams {
    uri?: string | null,
    feature?: Feature | null,
    scenario?: Pickle,
    step?: PickleStep | TestStep
}

export interface StepDefinitionOptions {
    retry: number
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
