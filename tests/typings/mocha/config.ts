const config: WebdriverIO.Config = {
    mochaOpts: {
        ui: 'qunit',
        // @ts-expect-error
        fullTrace: 'wrong param'
    },
    capabilities: {}
}

/**
 * check import of assertion lib
 */
expect($('foo')).toHaveTextContaining('foobar')
