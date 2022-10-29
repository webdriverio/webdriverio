const assert = require('node:assert')
const chromedriver = require('chromedriver')
const { remote } = require('../../packages/webdriverio')

;(async () => {
    await chromedriver.start(['--port=4444'])
    const client = await remote({
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
        }
    })

    await client.url('https://www.google.com/ncr')
    assert.equal(await client.getTitle(), 'Google')
    await client.deleteSession()
})().then(
    () => {
        console.log('WebdriverIO CJS Test Passed!')
        chromedriver.stop()
        process.exit(0)
    },
    (err) => {
        console.log('WebdriverIO CJS Test Failed!', err)
        chromedriver.stop()
        process.exit(1)
    }
)
