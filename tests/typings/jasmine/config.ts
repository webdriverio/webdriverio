const config: WebdriverIO.Config = {
    jasmineOpts: {
        requires: ['foo', 'bar'],
        // @ts-expect-error
        random: 'test wrong parameter',
        stopOnSpecFailure: true
    },
    capabilities: {}
}
