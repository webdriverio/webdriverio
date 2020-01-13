import CheckboxPage from '../pageobjects/checkbox.page'

describe('checkboxes', () => {
    it('checkbox 2 should be enabled', () => {
        CheckboxPage.open()
        expect(CheckboxPage.firstCheckbox).not.toBeSelected()
        expect(CheckboxPage.lastCheckbox).toBeSelected()
    })

    it('checkbox 1 should be enabled after clicking on it', () => {
        CheckboxPage.open()
        expect(CheckboxPage.firstCheckbox).not.toBeSelected()
        CheckboxPage.firstCheckbox.click()
        expect(CheckboxPage.firstCheckbox).toBeSelected()
    })
})
