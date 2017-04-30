describe('webdriver.io page', function() {

    it('should have the right title - the fancy generator way', function() {
        browser.url('/');
        var title = browser.getTitle();
        expect(title).toBe('WebdriverIO - WebDriver bindings for Node.js');
    });

});
