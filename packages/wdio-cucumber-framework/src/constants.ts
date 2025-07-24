import type { CucumberOptions } from './types.js'

export const DEFAULT_TIMEOUT = 60000

export const DEFAULT_OPTS: CucumberOptions = {
    paths: [],
    backtrace: false,
    dryRun: false,
    forceExit: false,
    failFast: false,
    format: [],
    formatOptions: {},
    import: [],
    language: 'en',
    name: [],
    order: 'defined',
    publish: false,
    require: [],
    requireModule: [],
    retry: 0,
    strict: false,
    tags: '',
    worldParameters: {},
    timeout: DEFAULT_TIMEOUT,
    scenarioLevelReporter: false,
    tagsInTitle: false,
    ignoreUndefinedDefinitions: false,
    failAmbiguousDefinitions: false,
    tagExpression: '',
    profiles: [],
    file: undefined
}

export const CUCUMBER_HOOK_DEFINITION_TYPES = [
    'beforeTestRunHookDefinitionConfigs',
    'beforeTestCaseHookDefinitionConfigs',
    'afterTestCaseHookDefinitionConfigs',
    'afterTestRunHookDefinitionConfigs',
] as const
