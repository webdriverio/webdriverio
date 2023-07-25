const assert = require('node:assert')
const { remote } = require('../../packages/webdriverio')

;(async () => {
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
        process.exit(0)
    },
    (err) => {
        console.log('WebdriverIO CJS Test Failed!', err)
        process.exit(1)
    }
)
