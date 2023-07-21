import { remote } from '../../packages/webdriverio/build/index.js'

(async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'chrome',
            version: '65',
            platform: 'XP',
            name: 'This is an example test'
        },
        hostname: 'hub.testingbot.com',
        port: 80,
        user: process.env.TESTINGBOT_KEY,
        key: process.env.TESTINGBOT_SECRET,
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
