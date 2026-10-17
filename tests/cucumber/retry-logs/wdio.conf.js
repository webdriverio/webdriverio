import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config as base } from '../../helpers/config.js'

export const config = {
    ...base,
    framework: 'cucumber',
    // The actual budget is only known after the worker hook runs.
    specFileRetries: 0,
    beforeSession(config) {
        config.specFileRetries = 2
    },
    cucumberOpts: {
        require: [path.join(path.dirname(fileURLToPath(import.meta.url)), 'steps.js')],
        retry: 0
    }
}
