var assert = require('assert');

module.exports = {
    wdTitleSpec: function* () {
        yield browser.url('/');
        var title = yield browser.getTitle();
        assert.equal(title, 'WebdriverIO - Selenium 2.0 javascript bindings for nodejs');

    },

    contextSpec: function* () {
        yield browser.pause(100);
        assert(this);
        assert(this.test);
        assert(this.test.title);
        assert(this.test.fullTitle());
    },

    skippableSpec: function* () {
        yield browser.pause(100);
        this.skip();
        throw new Error("this should not be reached");
    }
}
