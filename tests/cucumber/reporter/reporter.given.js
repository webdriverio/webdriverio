import { Given, BeforeAll, Before, After, AfterAll } from '@wdio/cucumber-framework'

BeforeAll(() => {})
Before(function () {})
After(function () {})
AfterAll(() => {})

Given('Foo', async () => {
    await expect(browser).toHaveTitle('Mock Page Title')
})
