exports.config = {
    specs: ['./test/spec/mobile/*'],
    exclude: ['./test/spec/mobile/d*.js'],
    capabilities: [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        specs: [
            './test/spec/unit/configparser.js',
            './test/spec/addValue.js'
        ],
        exclude: [
            './test/spec/mobile/context.js'
        ]
    },{
        browserName: 'phantomjs',
        specs: [
            './test/spec/desktop/chooseFile.js'
        ],
        exclude: [
            './test/spec/mobile/context.js',
            './test/spec/mobile/location.js'
        ]
    }]
}
