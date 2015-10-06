var hasES6Support = require('../../../lib/helpers/detectHarmony');
var generatorTests = hasES6Support ? require('./jasmine.generatorTests.js') : { wdTitleSpec: function () {} };

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

    (hasES6Support ? it : xit)('should have the right title - the fancy generator way', generatorTests.wdTitleSpec);

});
