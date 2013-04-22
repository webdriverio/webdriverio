/* jshint -W024 */
/* jshint expr:true */

var webdriverjs = require('../index'),
    assert      = require('assert');

module.exports = {

    setUp: function (callback) {
        client = webdriverjs.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
        client.init();

        callback();
    },
    test1: function (test) {
        client
            .url('https://github.com/')
            .getElementSize('.header-logo-wordmark', function(err, result) {
                test.ok(err === null, 'getElementSize() should cause no error');
                test.ok(result.height === 30, 'logo height should be 30px');
                test.ok(result.width  === 68, 'logo width should be 68px');
            })
            .getTitle(function(err, title) {
                test.ok(err === null, 'getTitle() should cause no error');
                test.ok(title === 'GitHub · Build software better, together.', 'title should be "GitHub · Build software better, together."');
            })
            .getElementCssProperty('class name','subheading', 'color', function(err, result){
                test.ok(err === null, 'getElementCssProperty() should cause no error');
                test.ok(result === 'rgba(136, 136, 136, 1)', 'color should be rgba(136, 136, 136, 1)');
            });

        test.done();
    },
    tearDown: function (callback) {
        // clean up
        client.end(callback);
    }
};