import path from 'path'

const TEST_ROOT = path.join(__dirname, '..')

exports.config = {
    user: 'foobar',
    key: '50fa142c-3121-4gb0-9p07-8q326vvbq7b0',
    specs: [path.join(TEST_ROOT, '*.test.js')],
    exclude: [
        path.join(TEST_ROOT, '/validateConfig.test.js')
    ],
    capabilities: [{
        browserName: 'chrome'
    }],
    suites: {
        unit: [path.join(TEST_ROOT, 'configparser.test.js')],
        mobile: [path.join(TEST_ROOT, 'detectBackend.test.js')],
        functional: [
            path.join(TEST_ROOT, 'validateConfig.test.js'),
            path.join(TEST_ROOT, '..', 'src/index.js')
        ]
    }
}
