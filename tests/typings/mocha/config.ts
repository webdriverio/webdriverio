import { some } from "expect-webdriverio/api"

// A third-party Mocha package can register its interface with @types/mocha.
declare module 'mocha' {
    interface InterfaceContributions {
        '@example/custom-tdd': never
    }
}

const config: WebdriverIO.Config = {
    mochaOpts: {
        ui: '@example/custom-tdd',
        // @ts-expect-error
        fullTrace: 'wrong param'
    },
    capabilities: [{}]
}

const mrconfig: WebdriverIO.MultiremoteConfig = {
    mochaOpts: {
        ui: 'qunit',
        // @ts-expect-error
        fullTrace: 'wrong param'
    },
    capabilities: {}
}

const mrconfig2: WebdriverIO.MultiremoteConfig = {
    mochaOpts: {
        ui: 'qunit',
        // @ts-expect-error
        fullTrace: 'wrong param'
    },
    capabilities: [{
        chromeBrowser: {
            capabilities: {
                browserName: 'chrome'
            }
        }
    }]
}

/**
 * check import of assertion lib
 */
expect($('foo')).toHaveText('foobar')
expect($$('foo')).toHaveText('foobar')
expect(some($$('foo'))).toHaveText(expect.oneOf('foobar', expect.stringContaining('foo')))
