import { Given, When, Then } from '@wdio/cucumber-framework'

let tries = 0
Given('step one', () => {})
When('step two', () => {})
Then('step three', () => {})
Then('a flaky step', () => {
    if (++tries === 1) {
        throw new Error('first try fails')
    }
})
