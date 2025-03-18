const assert = require('node:assert')
const Devtools = require('../../packages/devtools')

;(async () => {
    const client = await Devtools.newSession({
        capabilities: {
            browserName: 'chrome',
            'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
        }
    })

    await client.navigateTo('https://www.google.com/ncr')
    assert.equal(await client.getTitle(), 'Google')
    await client.deleteSession()
})().then(
    () => console.log('Devtools CJS Test Passed!') || process.exit(0),
    (err) => console.log('Devtools CJS Test Failed!', err) || process.exit(1)
)
