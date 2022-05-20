const path = require('node:path')

exports.config = {
    specs: [path.join(__dirname, '*.test.js')],
    suites: {
        pageWeight: ['./pageWeight.e2e.js'],
        scriptBlocking: ['./scriptBlocking.e2e.js']
    },
    logLevel: 'trace',
    baseUrl: 'https://magnificent-cabbage.glitch.me',
    framework: 'mocha',
    outputDir: path.join(__dirname, 'logs'),
    reporters: ['spec'],
    services: ['devtools'],
    capabilities: [{
        acceptInsecureCerts: true,
        browserName: 'chrome'
    }],
    mochaOpts: {
        ui: 'bdd',
        timeout: 30000
    }
}
