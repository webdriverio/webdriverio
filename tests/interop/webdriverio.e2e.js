const assert = require('node:assert')
const { remote, attach, multiremote, Key, SevereServiceError } = require('webdriverio')
const { os } = require('node:os')

const isLinux = os.platform() === 'linux'

;(async () => {
    assert.equal(typeof remote, 'function')
    assert.equal(typeof attach, 'function')
    assert.equal(typeof multiremote, 'function')
    assert.equal(typeof Key, 'object')
    assert.equal(typeof SevereServiceError, 'function')

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
        // Instructs WebDriver to capture driver-level logs
        'wdio:chromedriverOptions': {
            args: ['--verbose']
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
