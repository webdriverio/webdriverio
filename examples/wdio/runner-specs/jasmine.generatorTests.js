module.exports = {

    wdTitleSpec: function* () {
        yield browser.url('/');
        var title = yield browser.getTitle();
        expect(title).toBe('WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
    }
};
