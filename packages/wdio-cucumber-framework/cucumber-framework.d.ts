/// <reference types="expect-webdriverio"/>

import { SourceLocation, ScenarioResult, World } from "cucumber";

declare module "webdriverio" {
    interface HookFunctions extends CucumberHookFunctions {}
    interface Config extends CucumberOptsConfig {}
}

declare module "@wdio/sync" {
    interface HookFunctions extends CucumberHookFunctions {}
    interface Config extends CucumberOptsConfig {}
}

interface CucumberHookResult extends ScenarioResult {
    exception?: Error
}
interface CucumberHookObject {
    [key: string]: any;
}

interface StepData {
    uri: string,
    feature: CucumberHookObject,
    step: any
}

interface CucumberHookFunctions {
    beforeFeature?(uri: string, feature: CucumberHookObject, scenarios: CucumberHookObject[]): void;
    beforeScenario?(uri: string, feature: CucumberHookObject, scenario: CucumberHookObject, sourceLocation: SourceLocation, context?: World): void;
    beforeStep?(step: StepData, context: World): void;
    afterStep?(step: StepData, context: World, result: { error?: any, result?: any, passed: boolean, duration: number }): void;
    afterScenario?(uri: string, feature: CucumberHookObject, scenario: CucumberHookObject, result: CucumberHookResult, sourceLocation: SourceLocation, context?: World): void;
    afterFeature?(uri: string, feature: CucumberHookObject, scenarios: CucumberHookObject[]): void;
}

interface CucumberOptsConfig {
    cucumberOpts?: CucumberOpts
}

interface CucumberOpts {
    /**
     * Show full backtrace for errors.
     * @default true
     */
    backtrace?: boolean;
    /**
     * Require modules prior to requiring any support files.
     * @default []
     * @example `['@babel/register']` or `[['@babel/register', { rootMode: 'upward', ignore: ['node_modules'] }]]`
     */
    requireModule?: string[];
    /**
     * Treat ambiguous definitions as errors.
     *
     * Please note that this is a @wdio/cucumber-framework specific option
     * and not recognized by cucumber-js itself.
     * @default false
     */
    failAmbiguousDefinitions?: boolean;
    /**
     * Abort the run on first failure.
     * @default false
     */
    failFast?: boolean;
    /**
     * Treat undefined definitions as warnings.
     * Please note that this is a @wdio/cucumber-framework specific option and
     * not recognized by cucumber-js itself.
     * @default false
     */
    ignoreUndefinedDefinitions?: boolean;
    /**
     * Only execute the scenarios with name matching the expression (repeatable).
     * @default []
     */
    name?: RegExp[];
    /**
     * Specify the profile to use.
     * @default []
     */
    profile?: string[];
    /**
     * Require files containing your step definitions before executing features.
     * You can also specify a glob to your step definitions.
     * @default []
     * @example `[path.join(__dirname, 'step-definitions', 'my-steps.js')]`
     */
    require?: string[];
    /**
     * Specify a custom snippet syntax.
     */
    snippetSyntax?: string;
    /**
     * Hide step definition snippets for pending steps.
     * @default true
     */
    snippets?: boolean;
    /**
     * Hide source uris.
     * @default true
     */
    source?: boolean;
    /**
     * Fail if there are any undefined or pending steps
     * @default false
     */
    strict?: boolean
    /**
     * Only execute the features or scenarios with tags matching the expression.
     * Please see the [Cucumber documentation](https://docs.cucumber.io/cucumber/api/#tag-expressions) for more details.
     */
    tagExpression?: string;
    /**
     * Add cucumber tags to feature or scenario name
     * @default false
     */
    tagsInTitle?: boolean;
    /**
     * Timeout in milliseconds for step definitions.
     * @default 30000
     */
    timeout?: number;
    /**
     * Enable this to make webdriver.io behave as if scenarios
     * and not steps were the tests.
     * @default false
     */
    scenarioLevelReporter?: boolean;
}
