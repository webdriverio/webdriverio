import { remote } from '../../packages/webdriverio/build'

(async () => {
    const browser = await remote({
        capabilities: {
            platform : 'Windows 10',
            browserName : 'Chrome',
            version : '79.0',
            resolution : '1024x768'
        },
        hostname: 'hub.lambdatest.com',
        port: 80,
        user : process.env.LT_USERNAME,
        key: process.env.LT_ACCESS_KEY
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
