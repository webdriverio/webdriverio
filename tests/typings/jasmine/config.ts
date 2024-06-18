const config: WebdriverIO.Config = {
    jasmineOpts: {
        requires: ['foo', 'bar'],
        // @ts-expect-error
        random: 'test wrong parameter',
        stopOnSpecFailure: true
    },
    capabilities: [{}]
}

/**
 * check compatibility with WebdriverIO assertion lib
 */
expect($('foo')).toHaveTextContaining('foobar')
/**
 * check support for Jasmine specific matchers
 */
// @ts-ignore ToDo(@christian-bromann): fix typings
expect(true).toBeTrue()
