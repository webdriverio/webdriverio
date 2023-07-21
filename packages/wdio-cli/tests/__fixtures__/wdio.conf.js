import path from 'node:path'

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
        specs: [path.join(TEST_ROOT, 'test2.js')]
    }]
}
