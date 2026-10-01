const assert = require('node:assert')
const {
    remote, attach, multiRemote, Key, SevereServiceError, WDIO_KIND, WDIO_CHAINABLE
} = require('webdriverio')
const os = require('node:os')

const isLinux = os.platform() === 'linux'

;(async () => {
    assert.equal(typeof remote, 'function')
    assert.equal(typeof attach, 'function')
    assert.equal(typeof multiRemote, 'function')
    assert.equal(typeof Key, 'object')
    assert.equal(typeof SevereServiceError, 'function')
    assert.equal(WDIO_KIND, Symbol.for('wdio.kind'))
    assert.equal(WDIO_CHAINABLE, Symbol.for('wdio.chainable'))

    const client = await remote({
        logLevel: 'trace',
        capabilities: {
            browserName: 'chrome',
            browserVersion: 'stable',
            'goog:chromeOptions': {
                args: [
                    'headless', 'disable-gpu',
                    // Having `WebDriverError: session not created: Chrome instance exited` since ubuntu 22.04 to 24.04, since the below is no more wrapped by default.
                    // See https://github.com/webdriverio/webdriverio/issues/14168.
                    ...(isLinux ? ['no-sandbox'] : [])

                ]
            }
        },
    })

    assert.equal(client[WDIO_KIND], 'browser')

    await client.url('https://www.google.com/ncr')
    assert.equal(await client.getTitle(), 'Google')
    assert.equal(client.$('body')[WDIO_KIND], 'element')
    assert.equal(client.$('body')[WDIO_CHAINABLE], true)
    assert.equal((await client.$('body'))[WDIO_KIND], 'element')
    assert.equal((await client.$('body'))[WDIO_CHAINABLE], undefined)
    assert.equal(client.$$('body')[WDIO_KIND], 'element-array')
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
