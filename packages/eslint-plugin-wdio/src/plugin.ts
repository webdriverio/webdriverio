import awaitExpect from './rules/await-expect.js'
import noDebug from './rules/no-debug.js'
import noPause from './rules/no-pause.js'
import pkg from '../package.json' with { type: 'json' }

const index = {
    meta: {
        name: pkg.name,
        version: pkg.version,
    },
    configs: {},
    rules: {
        'await-expect': awaitExpect,
        'no-debug': noDebug,
        'no-pause': noPause,
    },
}

export default index
