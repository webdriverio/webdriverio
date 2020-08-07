class CustomService {
    onPrepare() {
        // TODO: something before all workers launch
    }
}

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
        }],
        ['crossbrowsertesting', {
            cbtTunnel: true,
            cbtTunnelOpts: {
                foo: 'bar'
            }
        }],
        ['firefox-profile', {
            extensions: [],
            profileDirectory: '/foo/bar',
            proxy: {},
            legay: false
        }],
        ['static-server', {
            folders: [{}],
            port: 1234,
            middleware: [{}]
        }],
        ['testingbot', {
            tbTunnel: true,
            tbTunnelOpts: {
                foo: 'bar'
            }
        }],
        [CustomService, {
            someOption: true
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
    }],

    filesToWatch: [
        '/foo/page-objects/**/*.page.js',
    ],
}
