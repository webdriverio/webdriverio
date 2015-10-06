describe('webdriver.io page', function() {

    it('should have the right title - the good old callback way', function(done) {

        browser
            .url('/')
            .getTitle(function(err, title) {
                expect(err).toBe(undefined);
                expect(title).toBe('WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
            })
            .call(done);

    });

    it('should have the right title - the promise way', function() {

        return browser
            .url('/')
            .getTitle().then(function(title) {
                expect(title).toBe('WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
            });

    });

    // NOTE: On Node 0.10 and below, the generator `function*` syntax in the following
    // test will break the parser. Use Babel (`require("babel/register")` in
    // wdio.jasmine.conf.js) or similar to transpile this code for older Nodes.

    it('should have the right title - the fancy generator way', function* () {

        yield browser.url('/');
        var title = yield browser.getTitle();
        expect(title).toBe('WebdriverIO - Selenium 2.0 javascript bindings for nodejs');

    });

});
