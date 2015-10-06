var assert = require('assert');

describe('webdriver.io page', function() {

    it('should have the right title - the good old callback way', function(done) {

        browser
            .url('/')
            .getTitle(function(err, title) {
                assert.equal(err, undefined);
                assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
            })
            .call(done);

    });

    it('should have the right title - the promise way', function() {

        return browser
            .url('/')
            .getTitle().then(function(title) {
                assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');
            });

    });

    it('should be a pending test');

    // NOTE: On Node 0.10 and below, the generator `function*` syntax in the following
    // tests will break the parser. Use Babel (`require("babel/register")` in
    // wdio.mocha.conf.js) or similar to transpile this code for older Nodes.

    it('should have the right title - the fancy generator way', function* () {

        yield browser.url('/');
        var title = yield browser.getTitle();
        assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');

    });

    it('should have mocha’s normal `this` context within a generator spec', function* () {
        yield browser.pause(100);
        assert(this);
        assert(this.test);
        assert(this.test.title);
        assert(this.test.fullTitle());
    });

    it('should be skippable (pending) from within a generator spec', function* () {
        yield browser.pause(100);
        this.skip();
        throw new Error("this should not be reached");
    });

});
