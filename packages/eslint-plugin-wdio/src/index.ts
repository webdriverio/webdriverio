import plugin from './plugin.js'
import { sharedGlobals } from './globals.js'
import jsRecommended from './configs/js-recommended.js'
import tsRecommended from './configs/ts-recommended.js'
import pkg from '../package.json' with { type: 'json' }

const legacyConfig = {
    rules: {
        'wdio/await-expect': 'error',
        'wdio/no-debug': 'error',
        'wdio/no-pause': 'error',
    },
    globals: sharedGlobals,
    plugins: ['wdio'],
}

const flatConfig = tsRecommended ?? jsRecommended

export const configs = {
    'flat/recommended': flatConfig,
    recommended: legacyConfig,
}
export const rules = tsRecommended?.rules ?? plugin.rules

export default {
    meta: {
        name: pkg.name,
        version: pkg.version
    },
    configs,
    rules
}
