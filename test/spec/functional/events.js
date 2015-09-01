var webdriverjs = require('../../../index.js'),
    conf = require('../../conf/index.js'),
    tmpConf = {
        desiredCapabilities: {
            browserName: 'phantomjs'
        }
    };

describe('event handling', function() {

    describe('is able to emit and listen to driver specific events and', function() {

        var isCommandHandlerEmitted = false,
            isErrorHandlerEmitted = false,
            isInitHandlerEmitted = false,
            isEndHandlerEmitted = false,
            uri = null,
            desiredCapabilties = null,
            client;

        before(function() {
            client = webdriverjs.remote(tmpConf);

            client.on('end', function() {
                isEndHandlerEmitted = true;
            });
            client.on('init', function() {
                isInitHandlerEmitted = true;
            });
            client.on('error', function() {
                isErrorHandlerEmitted = true;
            });
            client.on('command', function(e) {

                // assign variables only on first command
                if (isCommandHandlerEmitted) {
                    return;
                }

                isCommandHandlerEmitted = true;
                desiredCapabilties = e.data.desiredCapabilities.browserName;
                uri = e.uri;
            });
        });

        it('should emit an init event after calling the init command', function() {
            return client
                .init()
                .call(function() {
                    assert.ok(isInitHandlerEmitted, 'init handler wasn\'t called');
                    assert.strictEqual(uri.host, '127.0.0.1:4444');
                    assert.strictEqual(desiredCapabilties, 'phantomjs');
                });
        });

        /**
         * unable to catch error in testcase to test if isErrorHandlerEmitted flag got set
         * or: client doesn't send error message without throwing within test case
         */
        it.skip('should emit an error event after querying a non existing element', function() {
            return client
                .url(conf.testPage.start)
                // click on non existing element to cause an error
                .click('#notExistentant')
                .call(function() {
                    assert.ok(isErrorHandlerEmitted, 'error handler wasn\'t called');
                });
        });

        it('should emit an end event after calling the end command', function() {
            client.end();
            client.call(function() {
                assert.ok(isEndHandlerEmitted, 'end handler wasn\'t called');
            });
        });

    });

    describe('custom events', function() {
        var iWasTriggered = false,
            eventWasTriggeredAtLeastOnce = false;

        before(h.setup());

        beforeEach(function() {
            iWasTriggered = false;
            eventWasTriggeredAtLeastOnce = false;
            this.client.removeAllListeners('testme');
        });

        it('should register and fire events with on/emit', function() {
            return this.client
                .emit('testme')
                .on('testme', function() {
                    assert.ok(iWasTriggered, 'event was triggered unexpected');
                    eventWasTriggeredAtLeastOnce = true;
                })
                .call(function() {
                    iWasTriggered = true;
                })
                .emit('testme')
                .call(function() {
                    eventWasTriggeredAtLeastOnce.should.be.true;
                });

        });

        it('should register and fire events with once/emit', function() {
            return this.client
                .once('testme', function() {
                    assert.ok(iWasTriggered, 'event was triggered unexpected');
                    assert.ok(!eventWasTriggeredAtLeastOnce, 'once event got triggered twice');
                    eventWasTriggeredAtLeastOnce = true;
                })
                .call(function() {
                    iWasTriggered = true;
                })
                .emit('testme')
                .emit('testme');
        });

        it('two instances should have different event handlers', function() {
            var clientA = webdriverjs.remote(tmpConf);
            var clientB = webdriverjs.remote(tmpConf);

            clientA.on('testme', function(key) {
                assert.strictEqual(key, 'A');
            });
            clientB.on('testme', function(key) {
                assert.strictEqual(key, 'B');
            });

            clientA.emit('testme', 'A');
            clientB.emit('testme', 'B');

            return clientA.end().then(function() {
                return clientB.end();
            });
        });
    });
});