var ROOT = __dirname + '/../..'

exports.config = {
    host: '172.168.0.1',
    port: 4445,
    specs: [ROOT + '/test/spec/unit/*'],
    exclude: [ROOT + '/test/spec/unit/configparser.js'],
    capabilities: {
        browserName: 'chrome'
    }
}
