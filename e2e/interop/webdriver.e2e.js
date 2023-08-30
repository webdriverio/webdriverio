const assert = require('node:assert')
const WebDriver = require('../../packages/webdriver')
const command = require('../../packages/webdriver').command

assert.equal(typeof WebDriver.command, 'function')
assert.equal(typeof command, 'function')

;(async () => {
    const client = await WebDriver.newSession({
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
        }
    })

    await client.navigateTo('https://www.google.com/ncr')
    assert.equal(await client.getTitle(), 'Google')
    await client.deleteSession()
})().then(
    () => {
        console.log('WebDriver CJS Test Passed!')
        process.exit(0)
    },
    (err) => {
        console.log('WebDriver CJS Test Failed!', err)
        process.exit(1)
    }
)
