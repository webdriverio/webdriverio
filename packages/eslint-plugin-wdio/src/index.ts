import awaitExpect from './rules/await-expect'
import noDebug     from './rules/no-debug'
import noPause     from './rules/no-pause'

const rules = {
    'await-expect' : awaitExpect,
    'no-debug'     : noDebug,
    'no-pause'     : noPause
}

const configs = {
    recommended: {
        globals: {
            $                  : false,
            $$                 : false,
            browser            : false,
            driver             : false,
            expect             : false,
            multiremotebrowser : false,
        },
        rules : {
            'wdio/await-expect' : 'error',
            'wdio/no-debug'     : 'error',
            'wdio/no-pause'     : 'error',
        }
    }
}

export {
    rules,
    configs,
}
