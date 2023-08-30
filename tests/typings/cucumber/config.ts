import { expectType } from 'tsd'

const config: WebdriverIO.Config = {
    cucumberOpts: {
        timeout: 123,
        require: ['123'],
        // @ts-expect-error
        scenarioLevelReporter: "wrong param",
    },
    capabilities: {}
}

const configB: WebdriverIO.Config = {
    capabilities: {},
    beforeFeature (uri, feature) {
        expectType<string>(uri)
        expectType<string>(feature.children[0].scenario.name)
    }
}

/**
 * check import of assertion lib
 */
expect($('foo')).toHaveTextContaining('foobar')
