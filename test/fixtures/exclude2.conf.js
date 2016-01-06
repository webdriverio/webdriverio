var ROOT = __dirname + '/../..'

exports.config = {
    specs: [ROOT + '/test/spec/unit/*'],
    exclude: [ROOT + '/test/spec/unit/configparser.js'],
    capabilities: {
        browserName: 'chrome'
    }
}
