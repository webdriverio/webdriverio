import path from 'path'

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
        specs: [path.join(TEST_ROOT, 'test3.js')]
    },
    {
        browserName: 'test',
        specs: [path.join(TEST_ROOT, 'test2.js')]
    }]
}
