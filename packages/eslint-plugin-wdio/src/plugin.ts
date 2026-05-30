import awaitExpect from './rules/await-expect.js'
import noDebug from './rules/no-debug.js'
import noPause from './rules/no-pause.js'

const index = {
    configs: {},
    rules: {
        'await-expect': awaitExpect,
        'no-debug': noDebug,
        'no-pause': noPause,
    },
}

export default index
