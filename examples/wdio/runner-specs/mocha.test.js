var assert = require('assert');

var hasES6Support = require('../../../lib/helpers/detectHarmony');
var generatorTests = hasES6Support ? require('./mocha.generatorTests.js') : {};

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

    it('should have the right title - the fancy generator way', generatorTests.wdTitleSpec);

    it('should have mocha’s normal `this` context within a generator spec', generatorTests.contextSpec);

    it('should be skippable (pending) from within a generator spec', generatorTests.skippableSpec);

});
