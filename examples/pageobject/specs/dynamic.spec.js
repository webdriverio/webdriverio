var expect = require('chai').expect;
var DynamicPage = require('../pageobjects/dynamic.page');

describe('dynamic loading', function () {
    it('should be an button on the page', function () {
        DynamicPage.open();
        expect(DynamicPage.loadedPage.isExisting()).to.be.equal(false);

        DynamicPage.btnStart.click();
        DynamicPage.loadedPage.waitForExist();
        expect(DynamicPage.loadedPage.isExisting()).to.be.equal(true);
    });
});
