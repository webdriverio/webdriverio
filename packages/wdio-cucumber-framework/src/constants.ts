import url from 'node:url'
import path from 'node:path'

import type { CucumberOptions } from './types.js'

export const DEFAULT_TIMEOUT = 60000

export const DEFAULT_OPTS: CucumberOptions = {
    paths: [],
    backtrace: false,
    dryRun: false,
    forceExit: false,
    failFast: false,
    format: [path.resolve(url.fileURLToPath(import.meta.url), '../cucumberFormatter.js')],
    formatOptions: {},
    import: [],
    language: 'en',
    name: [],
    order: 'defined',
    parallel: 0,
    publish: false,
    require: [],
    requireModule: [],
    retry: 0,
    strict: false,
    tags: '',
    worldParameters: {},
    timeout: DEFAULT_TIMEOUT
}

