var expect = require('chai').expect;
var CheckboxPage = require('../pageobjects/checkbox.page');

describe('checkboxes', function () {
    it('checkbox 2 should be enabled', function () {
        CheckboxPage.open();
        expect(CheckboxPage.firstCheckbox.isSelected()).to.be.equal(false);
        expect(CheckboxPage.lastCheckbox.isSelected()).to.be.equal(true);
    });

    it('checkbox 1 should be enabled after clicking on it', function () {
        CheckboxPage.open();
        expect(CheckboxPage.firstCheckbox.isSelected()).to.be.equal(false);
        CheckboxPage.firstCheckbox.click();
        expect(CheckboxPage.firstCheckbox.isSelected()).to.be.equal(true);
    });
});
