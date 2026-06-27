const assert = require('node:assert')
const { remote, attach, multiremote, Key, SevereServiceError } = require('webdriverio')

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
                    'headless',
                    'disable-gpu',
                    '--enable-logging',       // Enables Chrome's internal logging
                    '--v=1'                   // Sets Chrome's verbosity level to 1
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
