import path from 'node:path'

const TEST_ROOT = path.join(__dirname, '..')

export const config: WebdriverIO.Config = {
    user: 'foobar',
    key: '50fa142c-3121-4gb0-9p07-8q326vvbq7b0',
    specs: [path.join(TEST_ROOT, '*.test.ts')],
    exclude: [
        path.join(TEST_ROOT, '/FileSystemPathService.test.ts'),
        path.join(TEST_ROOT, '/validateConfig.test.ts')
    ],
    capabilities: [{
        browserName: 'chrome',
        // @ts-expect-error invalid capability
        testobject_api_key: '1',
    }],
    suites: {
        unit: [path.join(TEST_ROOT, 'node', 'configparser.test.ts')],
        mobile: [path.join(TEST_ROOT, 'node', 'FileSystemPathService.test.ts')],
        functional: [
            path.join(TEST_ROOT, 'validateConfig.test.ts'),
            path.join(TEST_ROOT, '..', 'src/index.ts')
        ]
    }
}
