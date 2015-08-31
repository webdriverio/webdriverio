var vows = require('vows'),
    assert = require('assert'),
    webdriverio = require('../../index');

var client;

// Create a Test Suite
vows.describe('my github tests').addBatch({

    'init webdriverio': {

        topic: function () {
            client = webdriverio.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
            client.init(this.callback);
        },

        'starting webdriverio successfully': {

            topic: function () {
                client.url('https://github.com/', this.callback);
            },

            'check logo dimension': {

                topic: function () {
                    client.getElementSize('.header-logo-wordmark', this.callback);
                },

                'getElementSize() should cause no error': function(err) {
                    assert(err === null);
                },

                'height is 32px': function(err,result) {
                    assert(result.height === 26);
                },

                'width is 89px': function(err,result) {
                    assert(result.width === 37);
                }

            },

            'check title': {

                topic: function() {
                    client.getTitle(this.callback);
                },

                'getTitle() should cause no error': function(err) {
                    assert(err === null);
                },

                'title should be "GitHub · Build software better, together."': function(err,result) {
                    assert(result === 'GitHub · Build software better, together.');
                }

            },

            'check color of subheading': {

                topic: function() {
                    client.getCssProperty('a[href="/plans"]', 'color', this.callback);
                },

                'getElementCssProperty() should cause no error': function(err) {
                    assert(err === null);
                },

                'color should be rgba(64,120,192,1)': function(err,result) {
                    assert(result.value === 'rgba(64,120,192,1)');
                }

            }
        },

        'end webdriverio': {

            topic: function() {
                client.end(this.callback);
            },

            'should end successfully': function(err) {
                assert(err === null);
            }

        }
    }

}).run(); // Run it
