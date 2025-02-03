import { Then } from '../../../packages/wdio-cucumber-framework/build/index.js'

Then(/^the title of the page should be:$/, async (expectedTitle) => {
    const actualTitle = await browser.getTitle()
    expect(actualTitle).toBe(expectedTitle)
    await expect(browser).toHaveTitle(expectedTitle)
})

let hasRun = false
Then('I should fail once but pass on the second run', { wrapperOptions: { retry: 1 } }, function () {
    if (!hasRun) {
        hasRun = true
        expect(this.wdioRetries).toBe(0)
        throw new Error('boom!')
    }

    expect(this.wdioRetries).toBe(1)
})

Then('this is ambiguous', () => {
})

Then('this test should fail', () => {
    console.log('This step should have never been executed :-(')
    expect(true).toBe(false)
})

let fail = true
Then('this steps fails only the first time used', () => {
    if (fail) {
        fail = false
        expect(true).toBe(false)
    }
})
