export const config =
    {
        capabilities: [{
            browserName: 'chrome'
        }],
        logLevel: 'trace',
        framework: 'mocha',

        reporters: ['spec'],
        services: ['webdriver-mock'],

        mochaOpts: {
            ui: 'bdd',
            timeout: 15000
        },
        specs:
        [
            './mocha.test01.js',
            './mocha.test02.js',
            './mocha.test03.js',
            './testFail.test.js',
            [
                './mocha.test04.js',
                './testFail.test.js'
            ]
        ],
    }
