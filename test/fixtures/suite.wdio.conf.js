exports.config = {
    specs: ['index.js'],
    suites: {
        suiteA: [
            'test/setup-unit.js',
            'test/setup.js'
        ]
    },
    capabilities: [{
        browserName: 'phantomjs'
    }]
}
