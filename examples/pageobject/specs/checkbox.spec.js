import CheckboxPage from '../pageobjects/checkbox.page'

describe('checkboxes', () => {
    it('checkbox 2 should be enabled', async () => {
        await CheckboxPage.open()
        await expect(CheckboxPage.firstCheckbox).not.toBeSelected()
        await expect(CheckboxPage.lastCheckbox).toBeSelected()
    })

    it('checkbox 1 should be enabled after clicking on it', async () => {
        await CheckboxPage.open()
        await expect(CheckboxPage.firstCheckbox).not.toBeSelected()
        await CheckboxPage.firstCheckbox.click()
        await expect(CheckboxPage.firstCheckbox).toBeSelected()
    })
})
