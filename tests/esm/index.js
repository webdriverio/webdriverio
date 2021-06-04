import assert from 'assert'

import WebDriver from '../../packages/webdriver/build/index.js'
import WebdriverMockService from '../../packages/wdio-webdriver-mock-service/build/index.js'

let client

;(async () => {
    /**
     * mock out WebDriver backend
     */
    new WebdriverMockService()

    client = await WebDriver.newSession({
        path: '/',
        capabilities: { browserName: 'chrome' }
    })

    assert.strictEqual(await client.getTitle(), 'Mock Page Title')
    await client.deleteSession()
})().catch(async (err) => {
    console.error(err)
    process.exit(1)
})
