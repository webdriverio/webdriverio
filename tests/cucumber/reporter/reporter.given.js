import { Given, BeforeAll, Before, After, AfterAll } from '../../../packages/wdio-cucumber-framework/build/index.js'

BeforeAll(() => {})
Before(function () {})
After(function () {})
AfterAll(() => {})

Given('Foo', async () => {
    await expect(browser).toHaveTitle('Mock Page Title')
})
