import { Given, When, Then } from '@wdio/cucumber-framework'
import { browser, $, expect } from '@wdio/globals'
import cucumberJson from '@wdio/cucumberjs-json-reporter'

Given('I open the guinea pig page', async () => {
    await browser.url('https://guinea-pig.webdriver.io/')
})

When('I click the main title', async () => {
    await $('h1.findme').click()
})

Then('the page title is {string}', async (title: string) => {
    await expect(browser).toHaveTitle(title)
})

Then('the second page link is shown', async () => {
    await expect($('#secondPageLink')).toBeDisplayed()
})

Then('I attach a screenshot', async () => {
    cucumberJson.attach(await browser.takeScreenshot(), 'image/png')
})
