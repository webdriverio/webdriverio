const config: WebdriverIO.Config = {
    services: [
        ['selenium-standalone', {
            logs: 'string',
            installArgs: {
                version: ''
            },
            args: {
                basePath: ''
            },
            skipSeleniumInstall: true
        }]
    ],

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
    }],
    mochaOpts: {
        timeout: 3000,
        slow: 123
    },
    jasmineNodeOpts: {
        oneFailurePerSpec: true,
        specFilter: () => {}
    },
    cucumberOpts: {
        timeout: 123,
        require: ['123']
    }
}
