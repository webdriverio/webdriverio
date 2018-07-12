import assert from 'assert'

import DynamicPage from '../pageobjects/dynamic.page'

describe('dynamic loading', () => {
    it('should be an button on the page', () => {
        DynamicPage.open()
        assert.equal(DynamicPage.loadedPage.isExisting(), false)

        DynamicPage.btnStart.click()
        DynamicPage.loadedPage.waitForExist()
        assert.equal(DynamicPage.loadedPage.isExisting(), true)
    })
})
