import { remote } from '../../packages/webdriverio/build/index.js'

(async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'chrome',
            version: '74',
            platform: 'Windows 10',
            name: 'This is an example test'
        },
        hostname: 'hub.crossbrowsertesting.com',
        port: 80,
        user: process.env.CBT_USERNAME,
        key: process.env.CBT_AUTHKEY,
        logLevel: 'trace'
    })

    await browser.url('https://webdriver.io')

    const searchInput = await browser.$('.ds-input')
    await searchInput.addValue('click')

    const resultLabel = await browser.$('.algolia-docsearch-suggestion--title')
    await resultLabel.click()

    await browser.pause(1000)

    const title = await browser.getTitle()
    // eslint-disable-next-line
    console.log(title) // returns "should return "WebdriverIO - click""

    await browser.deleteSession()
})()
