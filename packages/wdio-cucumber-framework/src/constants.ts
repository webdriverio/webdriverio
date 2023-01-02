import type { Pickle, PickleStep } from '@cucumber/messages'
import type { CucumberOptions } from './types.js'

export const DEFAULT_TIMEOUT = 60000

export const DEFAULT_OPTS: CucumberOptions = {
    backtrace: false, // <boolean> show full backtrace for errors
    requireModule: [], // <string[]> ("module") require MODULE files (repeatable)
    failAmbiguousDefinitions: false, // <boolean> treat ambiguous definitions as errors
    failFast: false, // <boolean> abort the run on first failure
    ignoreUndefinedDefinitions: false, // <boolean> treat undefined definitions as warnings
    names: [], // <(string|RegExp)[]> only execute the scenarios with name matching the expression (repeatable)
    require: [], // <string> (file/dir/glob) require files before executing features
    order: 'defined', // <string> switch between deterministic  and random feature execution. Either "defined", "random" or "random:42" whereas 42 is the seed for randomization
    snippets: true, // <boolean> hide step definition snippets for pending steps
    source: true, // <boolean> hide source uris
    strict: false, // <boolean> fail if there are any undefined or pending steps
    tagExpression: '', // <string> (expression) only execute the features or scenarios with tags matching the expression
    tagsInTitle: false, // <boolean> add cucumber tags to feature or scenario name
    timeout: DEFAULT_TIMEOUT, // <number> timeout for step definitions in milliseconds
    retry: 0,
    scenarioLevelReporter: false,
    featureDefaultLanguage: 'en'
}

/* istanbul ignore next */
export const NOOP = function () {}

export const CUCUMBER_HOOK_DEFINITION_TYPES = [
    'beforeTestRunHookDefinitionConfigs',
    'beforeTestCaseHookDefinitionConfigs',
    'afterTestCaseHookDefinitionConfigs',
    'afterTestRunHookDefinitionConfigs',
] as const

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
