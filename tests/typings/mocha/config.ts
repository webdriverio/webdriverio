import { some } from "expect-webdriverio/api"

const config: WebdriverIO.Config = {
    mochaOpts: {
        ui: 'qunit',
        failHookAffectedTests: false,
        // @ts-expect-error
        fullTrace: 'wrong param'
    },
    capabilities: [{}]
}

const customUiStringConfig: WebdriverIO.Config = {
    mochaOpts: {
        ui: './custom-qunit.cjs'
    },
    capabilities: [{}]
}

const customUiFnConfig: WebdriverIO.Config = {
    mochaOpts: {
        ui: (_suite) => {}
    },
    capabilities: [{}]
}
void customUiStringConfig
void customUiFnConfig

const mrconfig: WebdriverIO.MultiRemoteConfig = {
    mochaOpts: {
        ui: 'qunit',
        // @ts-expect-error
        fullTrace: 'wrong param'
    },
    capabilities: {}
}

const mrconfig2: WebdriverIO.MultiRemoteConfig = {
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
