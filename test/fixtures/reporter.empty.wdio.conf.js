exports.config = {
    specs: ['index.js'],
    capabilities: [{
        browserName: 'phantomjs'
    }],
    reporters: [require('./reporter.empty')]
}
