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

    it('should have the right title - the fancy generator way', function* () {

        yield browser.url('/');
        var title = yield browser.getTitle();
        assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');

    });

});