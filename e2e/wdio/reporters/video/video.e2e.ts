import { browser, $, expect } from '@wdio/globals'

/**
 * The commands that change the page give the frames of the video. In a WebDriver
 * BiDi session `url` and `back` use BiDi, `click` uses WebDriver Classic.
 */
describe('video reporter', () => {
    it('records the commands of a test', async () => {
        await browser.url('https://guinea-pig.webdriver.io/')
        await $('h1.findme').click()
        await $('#secondPageLink').click()
        await browser.back()
        await expect($('h1.findme')).toBeDisplayed()
    })

    it('records a second test', async () => {
        await browser.url('https://guinea-pig.webdriver.io/two.html')
        await browser.url('https://guinea-pig.webdriver.io/')
        await expect($('h1.findme')).toBeDisplayed()
    })
})
