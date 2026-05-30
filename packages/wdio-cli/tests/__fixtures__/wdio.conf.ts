import path from 'node:path'

const TEST_ROOT: string = path.join(__dirname, 'guineapig')

export const config: WebdriverIO.Config = {
    specs: [path.join(TEST_ROOT, '*.js')],
    exclude: [
        path.join(TEST_ROOT, 'test2.js')
    ],
    capabilities: [{
        browserName: 'chrome'
    }, {
        browserName: 'firefox',
    }]
}
