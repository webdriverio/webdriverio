import DevTools from '../../packages/devtools/src/index'

import { ELEMENT_KEY } from '../../packages/devtools/src/constants'

let browser

beforeAll(() => {
    browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'firefox',
            'moz:firefoxOptions': {
                headless: true
            }
        }
    })
})

test('running session with Firefox', async () => {
    await browser.navigateTo('https://www.whatismybrowser.com/detect/what-is-my-user-agent')

    const elem = await browser.findElement('css selector', '#detected_value')
    const userAgent = await browser.getElementText(elem[ELEMENT_KEY])

    console.log('Detected user agent:', userAgent)
    expect(userAgent).toContain('Firefox')
})

afterAll(async () => {
    await browser.deleteSession()
})
