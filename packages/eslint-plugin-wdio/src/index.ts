import awaitExpect from './rules/await-expect.js'
import noDebug from './rules/no-debug.js'
import noPause from './rules/no-pause.js'

const rules = {
    'await-expect': awaitExpect,
    'no-debug': noDebug,
    'no-pause': noPause
}

const configs = {
    recommended: {
        globals: {
            $: false,
            $$: false,
            browser: false,
            driver: false,
            expect: false,
            multiremotebrowser: false,
        },
        rules: {
            'wdio/await-expect': 'error',
            'wdio/no-debug': 'error',
            'wdio/no-pause': 'error',
        }
    }
}

export {
    rules,
    configs,
}
