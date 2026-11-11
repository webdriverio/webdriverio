import { Before, Given, Then } from '@wdio/cucumber-framework'
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

Given('je passe', () => {})

// cucumberjs-json.ambiguous.feature: 2 step definitions match
Given('I am ambiguous', () => {})
Given(/^I am ambig/, () => {})

// cucumberjs-json.hooks.feature: Cucumber skips the hooks after a failed hook
Before({ tags: '@hookFails' }, () => {
    throw new Error('the hook fails')
})
Before({ tags: '@hookFails' }, () => {})
Before({ tags: '@hookSkips' }, () => 'skipped')
