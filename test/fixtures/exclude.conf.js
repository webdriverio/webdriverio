var ROOT = __dirname + '/../..'

exports.config = {
    specs: [ROOT + '/test/spec/unit/*'],
    exclude: [
        ROOT + '/test/spec/unit/configparser.js',
        ROOT + '/test/spec/functional/selectorExecute.js',
        ROOT + '/test/spec/mobile/context.js'
    ],
    capabilities: {
        browserName: 'chrome'
    },
    suites: {
        unit: [ROOT + '/test/spec/unit/*'],
        mobile: [ROOT + '/test/spec/mobile/*'],
        functional: [ROOT + '/test/spec/functional/*']
    }
}
