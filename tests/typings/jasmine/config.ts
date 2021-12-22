const config: WebdriverIO.Config = {
    jasmineOpts: {
        requires: ['foo', 'bar'],
        // @ts-expect-error
        random: 'test wrong parameter',
        stopOnSpecFailure: true
    },
    capabilities: {}
}

/**
 * check import of assertion lib
 */
expect($('foo')).toHaveTextContaining('foobar')
