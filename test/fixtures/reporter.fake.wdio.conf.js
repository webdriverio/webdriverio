exports.config = {
    specs: ['index.js'],
    capabilities: [{
        browserName: 'phantomjs'
    }],
    reporters: ['unreal']
}
