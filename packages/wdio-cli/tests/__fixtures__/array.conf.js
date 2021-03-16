import path from 'path'

const TEST_ROOT = path.join(__dirname, 'guineapig')

exports.config = {
    specs: [
        path.join(TEST_ROOT, 'test1.js'),
        [path.join(TEST_ROOT, '*.js')],
        path.join(TEST_ROOT, 'test2.js')
    ],
    // exclude: [
    //     path.join(TEST_ROOT, 'test2.js')
    // ],
    capabilities: [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
        specs: [path.join(TEST_ROOT, 'test2.js')]
    }]
}
