import plugin from './plugin.js'
import jsRecommended from './configs/js-recommended.js'
import tsRecommended from './configs/ts-recommended.js'
import pkg from '../package.json' with { type: 'json' }

const flatConfig = tsRecommended ?? jsRecommended

export const configs = {
    'flat/recommended': flatConfig,
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
