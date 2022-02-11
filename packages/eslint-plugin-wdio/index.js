module.exports = {
    rules : {
        'await-expect': require('./lib/rules/await-expect'),
        'no-debug': require('./lib/rules/no-debug'),
        'no-pause': require('./lib/rules/no-pause'),
    },
    configs: {
        recommended: {
            globals: {
                $: false,
                $$: false,
                browser: false,
                multiremotebrowser: false,
                driver: false,
                expect: false
            },
            rules : {
                'wdio/await-expect': 2,
                'wdio/no-debug': 2,
            }
        }
    }
}
