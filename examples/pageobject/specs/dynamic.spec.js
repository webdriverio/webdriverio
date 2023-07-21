import DynamicPage from '../pageobjects/dynamic.page.js'

describe('dynamic loading', () => {
    it('should be an button on the page', async () => {
        await DynamicPage.open()
        await expect(DynamicPage.loadedPage).not.toBeExisting()

        await DynamicPage.btnStart.click()
        await DynamicPage.loadedPage.waitForExist()
        await expect(DynamicPage.loadedPage).toBeExisting()
    })
})
