import url from 'node:url'
import path from 'node:path'

import type { CucumberOptions } from './types.js'

export const DEFAULT_TIMEOUT = 60000

export const FILE_PROTOCOL = 'file://'

const cucumberFormatter = path.resolve(url.fileURLToPath(import.meta.url), '../cucumberFormatter.js')

export const DEFAULT_OPTS: CucumberOptions = {
    paths: [],
    backtrace: false,
    dryRun: false,
    forceExit: false,
    failFast: false,
    format: [cucumberFormatter],
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
    profiles: []
}
