import { remote } from '../../packages/webdriverio/build/index.js'

(async () => {
    const browser = await remote({
        capabilities: {
            browser : 'Chrome',
            browser_version : '46.0',
            os : 'Windows',
            os_version : '10',
            resolution : '1024x768'
        },
        hostname: 'hub.browserstack.com',
        port: 80,
        user : process.env.BROWSERSTACK_USERNAME,
        key: process.env.BROWSERSTACK_ACCESS_KEY,
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
