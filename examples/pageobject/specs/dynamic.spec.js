import DynamicPage from '../pageobjects/dynamic.page'

describe('dynamic loading', () => {
    it('should be an button on the page', () => {
        DynamicPage.open()
        expect(DynamicPage.loadedPage).not.toBeExisting()

        DynamicPage.btnStart.click()
        DynamicPage.loadedPage.waitForExist()
        expect(DynamicPage.loadedPage).toBeExisting()
    })
})
