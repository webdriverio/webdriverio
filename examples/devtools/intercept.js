/**
 * in order to run this file make sure you have `webdriverio`
 * installed using NPM before running it:
 *
 *   $ npm install webdriverio
 *
 */
const { remote } = require('webdriverio')

let browser;

(async () => {
    browser = await remote({
        capabilities: {
            browserName: 'chrome'
        }
    })

    await browser.url('https://webdriver.io')

    await browser.call(async () => {
        const puppeteerBrowser = await browser.getPuppeteer()
        const page = (await puppeteerBrowser.pages())[0]
        await page.setRequestInterception(true)
        page.on('request', interceptedRequest => {
            if (interceptedRequest.url().endsWith('webdriverio.png')) {
                return interceptedRequest.continue({
                    url: 'https://user-images.githubusercontent.com/10379601/29446482-04f7036a-841f-11e7-9872-91d1fc2ea683.png'
                })
            }

            interceptedRequest.continue()
        })
    })

    // continue with WebDriver commands
    await browser.refresh()
    await browser.pause(2000)

    await browser.deleteSession()
})().catch(async (e) => {
    console.error(e)
    await browser.deleteSession()
})
