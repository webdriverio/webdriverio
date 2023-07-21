import { remote } from '../../packages/webdriverio/build/index.js'

(async () => {
    const browser = await remote({
        capabilities: {
            sessionName: 'Automation test session',
            sessionDescription: 'This is an example for Automation Test on Android device',
            deviceOrientation: 'portrait',
            captureScreenshots: true,
            browserName: 'chrome',
            deviceGroup: 'KOBITON',
            deviceName: 'Galaxy Note5',
            platformVersion: '6.0.1',
            platformName: 'Android'
        },
        protocol: 'https',
        port: 443,
        hostname: 'api.kobiton.com',
        user: process.env.KOBITON_USERNAME,
        key: process.env.KOBITON_ACCESS_KEY,
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
