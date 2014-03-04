var webdriverjs = require('../../index.js'),
    merge = require('lodash.merge'),
    conf = require('../conf/index.js');

describe('event handling', function () {
    
    var isCommandHandlerEmitted = false,
        isErrorHandlerEmitted = false,
        isInitHandlerEmitted = false,
        isEndHandlerEmitted = false,
        commandUrl = null,
        desiredCapabilties = null,
        client;

    before(function() {
        client = webdriverjs.remote(merge(conf, {
            singleton: true
        }));

        client.on('end', function() {
            isEndHandlerEmitted = true;
        })
        client.on('init', function() {
            isInitHandlerEmitted = true;
        })
        client.on('error', function() {
            isErrorHandlerEmitted = true;
        })
        client.on('command', function(e) {

            // assign variables only on first command
            if(isCommandHandlerEmitted) {
                return;
            }

            isCommandHandlerEmitted = true;
            desiredCapabilties = e.data.desiredCapabilities.browserName;
            commandUrl = e.uri;
        })
    });

    it('should emit an init event and therefore an command event as well',function(done) {
        client
            .init()
            .call(function() {
                assert.ok(isInitHandlerEmitted,'init handler wasn\'t called');
                assert.strictEqual(commandUrl,'http://localhost:' + conf.port + '/wd/hub/session');
                assert.strictEqual(desiredCapabilties,conf.desiredCapabilities.browserName);
            })
            .call(done);
    });

    it('should emit an error event', function(done) {
        client
            .url(conf.testPage.start)
            // click on non existing element to cause an error
            .click('#notExistentant')
            .call(function() {
                assert.ok(isErrorHandlerEmitted,'error handler wasn\'t called');
            })
            .call(done);
    });

    it('should emit an end event', function(done) {
        client
            .end()
            .call(function() {
                assert.ok(isEndHandlerEmitted,'end handler wasn\'t called');
            })
            .call(done);
    });
});
