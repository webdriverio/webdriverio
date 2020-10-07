import DevTools from '../../packages/devtools/src/index'

import { ELEMENT_KEY } from '../../packages/devtools/src/constants'

let browser

beforeAll(async () => {
    browser = await DevTools.newSession({
        outputDir: __dirname,
        capabilities: {
            browserName: 'edge',
            'ms:edgeOptions': {
                headless: true
            }
        }
    })
})

test('running session with Chromium Edge', async () => {
    await browser.navigateTo('https://www.whatismybrowser.com/detect/what-is-my-user-agent')

    const elem = await browser.findElement('css selector', '#detected_value')
    const userAgent = await browser.getElementText(elem[ELEMENT_KEY])

    console.log('Detected user agent:', userAgent)
    expect(userAgent).toContain('Edge')
})

afterAll(async () => {
    await browser.deleteSession()
})
