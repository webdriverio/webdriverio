exports.config = Object.assign({
    specs: '/foo/bar.js,'.repeat(20).split(',').slice(0, -1),
    capabilities: [{
        browserName: 'phantomjs'
    }, {
        browserName: 'phantomjs'
    }, {
        browserName: 'phantomjs'
    }, {
        browserName: 'phantomjs'
    }, {
        browserName: 'phantomjs'
    }]
})
