import DevTools from '../packages/devtools/src/index'

jest.setTimeout(30000)

beforeAll(async () => {
    global.browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': {
                headless: true
            }
        }
    })
})
