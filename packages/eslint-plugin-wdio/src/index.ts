import awaitExpect from './rules/await-expect.js'
import noDebug from './rules/no-debug.js'
import noPause from './rules/no-pause.js'

const sharedGlobals = {
    $: false,
    $$: false,
    browser: false,
    driver: false,
    expect: false,
    multiremotebrowser: false,
} as const

const sharedConfig = {
    rules: {
        'wdio/await-expect': 'error',
        'wdio/no-debug': 'error',
        'wdio/no-pause': 'error',
    },
} as const

const index = {
    configs: {},
    rules: {
        'await-expect': awaitExpect,
        'no-debug': noDebug,
        'no-pause': noPause,
    },
}

const legacyConfig = {
    ...sharedConfig,
    globals: sharedGlobals,
    plugins: ['wdio'],
}

const flatConfig = {
    ...sharedConfig,
    languageOptions: {
        globals: sharedGlobals,
    },
    plugins: {
        wdio: index,
    },
}

export const configs = {
    'flat/recommended': flatConfig,
    recommended: legacyConfig,
}
export const rules = index.rules
