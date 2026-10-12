import { Given, Then } from '@wdio/cucumber-framework'
import cucumberJson from '@wdio/cucumberjs-json-reporter'

Given('I attach the text {string}', (text) => {
    cucumberJson.attach(text)
})

Given('I attach the JSON value {string}', (value) => {
    cucumberJson.attach({ value }, 'application/json')
})

Then('the page title is {string}', async (title) => {
    await expect(browser).toHaveTitle(title)
})
