import path from 'path'

const TEST_ROOT = path.join(__dirname, 'guineapig')

exports.config = {
    specs: [path.join(TEST_ROOT, '*.js')],
    exclude: [
        path.join(TEST_ROOT, 'test2.js')
    ],
    capabilities: [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        specs: [path.join(TEST_ROOT, 'test3.js')]
    },
    {
        // maxInstances can get overwritten per capability. So if you have an in-house Selenium
        // grid with only 5 firefox instances available you can make sure that not more than
        // 5 instances get started at a time.
        maxInstances: 5,
        //
        browserName: 'chrome',
        acceptInsecureCerts: true,
        'goog:chromeOptions' : { 'args' : ['window-size=8000,1200'] }
        // If outputDir is provided WebdriverIO can capture driver session logs
        // it is possible to configure which logTypes to include/exclude.
        // excludeDriverLogs: ['*'], // pass '*' to exclude all driver session logs
        // excludeDriverLogs: ['bugreport', 'server'],
        //
    }]
}
