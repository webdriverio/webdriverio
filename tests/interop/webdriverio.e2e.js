const assert = require('node:assert')
const { remote, attach, multiremote, Key, SevereServiceError } = require('webdriverio')

;(async () => {
    assert.equal(typeof remote, 'function')
    assert.equal(typeof attach, 'function')
    assert.equal(typeof multiremote, 'function')
    assert.equal(typeof Key, 'object')
    assert.equal(typeof SevereServiceError, 'function')

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
