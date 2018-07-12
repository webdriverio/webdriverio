import assert from 'assert'

import CheckboxPage from '../pageobjects/checkbox.page'

describe('checkboxes', () => {
    it('checkbox 2 should be enabled', () => {
        CheckboxPage.open()
        assert.equal(CheckboxPage.firstCheckbox.isSelected(), false)
        assert.equal(CheckboxPage.lastCheckbox.isSelected(), true)
    })

    it('checkbox 1 should be enabled after clicking on it', () => {
        CheckboxPage.open()
        assert.equal(CheckboxPage.firstCheckbox.isSelected(), false)
        CheckboxPage.firstCheckbox.click()
        assert.equal(CheckboxPage.firstCheckbox.isSelected(), true)
    })
})
