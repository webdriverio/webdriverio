// division-by-zero-test.js

var vows = require('vows'),
    assert = require('assert'),
    webdriverjs = require('../index'),
    fs = require('fs');

var client;

// Create a Test Suite
vows.describe('my github tests').addBatch({

    'init webdriverjs': {

        topic: function () {
            client = webdriverjs.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
            client.init(this.callback);
        },

        'starting webdriverjs successfully': {

            topic: function (init) {
                client.url('https://github.com/', this.callback);
            },

            'check logo dimension': {

                topic: function (url) {
                    client.getElementSize('.header-logo-wordmark', this.callback);
                },

                'getElementSize() should cause no error': function(err,result) {
                    assert(err === null);
                },

                'height is 30px': function(err,result) {
                    assert(result.height === 30);
                },

                'width is 68px': function(err,result) {
                    assert(result.width === 68);
                }

            },

            'check title': {

                topic: function() {
                    client.getTitle(this.callback);
                },

                'getTitle() should cause no error': function(err,result) {
                    assert(err === null);
                },

                'title should be "GitHub · Build software better, together."': function(err,result) {
                    assert(result === 'GitHub · Build software better, together.');
                }

            },

            'check color of subheading': {

                topic: function() {
                    client.getElementCssProperty('class name','subheading', 'color', this.callback);
                },

                'getElementCssProperty() should cause no error': function(err,result) {
                    assert(err === null);
                },

                'color should be rgba(136, 136, 136, 1)': function(err,result) {
                    assert(result === 'rgba(136, 136, 136, 1)');
                }

            }
        },

        'end webdriverjs': {

            topic: function() {
                client.end(this.callback);
            },

            'should end successfully': function(err,result) {
                assert(err === null);
            }

        }
    }

}).run(); // Run it