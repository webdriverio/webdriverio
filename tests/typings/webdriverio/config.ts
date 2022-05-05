import { expectType } from 'tsd'

class CustomService {
    onPrepare() {
        // TODO: something before all workers launch
    }
}

const configA: WebdriverIO.Config = {
    // @ts-expect-error should not be available
    beforeFeature () {

    },

    async onWorkerEnd (cid, exitCode, specs, retries) {
        expectType<string>(cid)
        expectType<number>(exitCode)
        expectType<string[]>(specs)
        expectType<number>(retries)
    },

    async beforeCommand (name) {
        name.toLowerCase()
        const title = await browser.getTitle()
        title.slice(0, 1)
    }
}

const config: WebdriverIO.Config = {
    services: [
        ['sauce', {
            sauceConnect: true,
            sauceConnectOpts: {
                directDomains: 'some.domain'
            },
            scRelay: true,
            // @ts-expect-error test wrong parameter
            parentTunnel: 123
        }],
        ['appium', {
            args: {
                basePath: 'some/path',
                // @ts-expect-error test wrong parameter
                port: true
            }
        }],
        ['browserstack', {
            browserstackLocal: true,
            // @ts-expect-error test wrong parameter
            forcedStop: 'no'
        }],
        ['devtools', {
            coverageReporter: {
                enable: true,
                // @ts-expect-error test wrong parameter
                type: 'foo'
            }
        }],
        ['selenium-standalone', {
            logs: 'string',
            installArgs: {
                version: ''
            },
            args: {
                basePath: ''
            },
            skipSeleniumInstall: true,
            drivers: {
                chrome: 'yes',
                // @ts-expect-error test wrong parameter
                brave: 'no'
            }
        }],
        ['crossbrowsertesting', {
            // @ts-expect-error test wrong parameter
            cbtTunnel: 'true',
            cbtTunnelOpts: {
                foo: 'bar'
            }
        }],
        ['firefox-profile', {
            extensions: [],
            profileDirectory: '/foo/bar',
            proxy: { proxyType: 'direct' },
            legay: false
        }],
        ['static-server', {
            folders: [{
                mount: '',
                path: ''
            }],
            port: 1234,
            middleware: [{
                mount: '',
                middleware: ''
            }]
        }],
        ['testingbot', {
            tbTunnel: true,
            tbTunnelOpts: {
                tunnelIdentifier: 'identifier',
                // @ts-expect-error
                tunnelVersion: 0,
                apiKey: 'key',
                apiSecret: 'secret',
            }
        }],
        [CustomService, {
            someOption: true
        }]
    ],

    reporters: [
        ['allure', {
            issueLinkTemplate: 'foo',
            // @ts-expect-error
            useCucumberStepReporter: 'wrong-param'
        }],
        ['sumologic', {
            // @ts-expect-error
            syncInterval: 'wrong param',
            sourceAddress: 'http://foo'
        }]
    ],

    automationProtocol: 'webdriver',
    logLevels: {
        webdriver: 'info',
    },

    capabilities: [{
        browserName: 'chrome',
        'goog:chromeOptions': {
            binary: 'path/to/chrome',
            args: ['--no-first-run', '--enable-automation'],
            prefs: {
                'profile.managed_default_content_settings.popups': 1,
                'profile.managed_default_content_settings.notifications': 1,
            }
        }
    }, {
        browserName: 'firefox',
        'moz:firefoxOptions': {
            binary: 'path/to/firefox',
            profile: 'path/to/profile',
            args: ['-headless'],
            prefs: {
                'browser.tabs.remote.autostart': false,
                'toolkit.telemetry.reportingpolicy.firstRun': false,
            },
            log: { level: 'error' }
        }
    }, {
        'selenoid:options': {
            enableVNC: true,
            enableVideo: true,
            enableLog: true,
            logName: 'test.log',
            videoName: 'test.mp4'
        }
    }, {
        'wdio:devtoolsOptions': {
            ignoreDefaultArgs: false
        }
    }] as WebDriver.DesiredCapabilities[],

    filesToWatch: [
        '/foo/page-objects/**/*.page.js',
    ]
}
