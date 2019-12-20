import assert from 'assert'

// eslint-disable-next-line
import { Then } from 'cucumber'

Then('the title of the page should be {string}', (expectedTitle) => {
    const actualTitle = browser.getTitle()
    assert.equal(actualTitle, expectedTitle)
})

Then('the title of the page should be {string} async', async (expectedTitle) => {
    const actualTitle = await browser.getTitle()
    assert.equal(actualTitle, expectedTitle)
})

let hasRun = false
Then('I should fail once but pass on the second run', { wrapperOptions: { retry: 1 } }, function () {
    if (!hasRun) {
        hasRun = true
        assert.equal(this.wdioRetries, 0)
        throw new Error('boom!')
    }

    assert.equal(this.wdioRetries, 1)
})

Then('this is ambiguous', () => {
})
