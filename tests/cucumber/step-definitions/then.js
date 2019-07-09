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

let someFlag = false
Then('I should fail once but pass on the second run', { wrapperOptions: { retry: 1 } }, () => {
    if (!someFlag) {
        someFlag = true
        throw new Error('boom!')
    }

    someFlag = false
    assert.equal(1, 1)
})

Then('this is ambiguous', () => {
})
