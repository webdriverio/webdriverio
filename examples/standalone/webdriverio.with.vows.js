var vows = require('vows'),
    assert = require('assert'),
    webdriverio = require('../../build');

var client;

// Create a Test Suite
vows.describe('my github tests').addBatch({

    'init webdriverio': {

        topic: function () {
            client = webdriverio.remote({ desiredCapabilities: {browserName: 'phantomjs'} });
            client.init()
                .then(this.callback.bind(this, null))
                .catch(this.callback.bind(this))
        },

        'starting webdriverio successfully': {

            topic: function () {
                client.url('https://github.com/')
                    .then(this.callback.bind(this, null))
                    .catch(this.callback.bind(this))
            },

            'check logo dimension': {

                topic: function () {
                    client.getElementSize('.header-logo-wordmark')
                        .then(this.callback.bind(this, null))
                        .catch(this.callback.bind(this));
                },

                'getElementSize() should cause no error': function(err) {
                    assert(err === null);
                },

                'height is 32px': function(err,result) {
                    assert(result.height === 26);
                },

                'width is 89px': function(err,result) {
                    assert(result.width === 89);
                }

            },

            'check title': {

                topic: function() {
                    client.getTitle()
                        .then(this.callback.bind(this, null))
                        .catch(this.callback.bind(this))
                },

                'getTitle() should cause no error': function(err) {
                    assert(err === null);
                },

                'title should be "GitHub · Where software is built"': function(err,result) {
                    assert(result === 'GitHub · Where software is built');
                }

            },

            'check color of subheading': {

                topic: function() {
                    client.getCssProperty('a[href="/plans"]', 'color')
                        .then(this.callback.bind(this, null))
                        .catch(this.callback.bind(this))
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
                client.end()
                    .then(this.callback.bind(this, null))
                    .catch(this.callback.bind(this))
            },

            'should end successfully': function(err) {
                assert(err === null);
            }

        }
    }

}).run(); // Run it
