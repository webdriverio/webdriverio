var WebdriverIO = require('../../../../index.js'),
    conf = require('../../../conf/index.js');

/* global beforeEach */
describe('event handling executed by single multibrowser instance', function() {
    describe('is able to emit and listen to driver specific events and', function() {

        var isCommandHandlerEmitted = false,
            isErrorHandlerEmitted = false,
            isInitHandlerEmitted = false,
            isEndHandlerEmitted = false,
            uri = null,
            desiredCapabilties = null,
            matrix, browserA;

        before(function() {
            matrix = WebdriverIO.multiremote(conf.capabilities);
            browserA = matrix.select('browserA');

            browserA.on('end', function() {
                isEndHandlerEmitted = true;
            });
            browserA.on('init', function() {
                isInitHandlerEmitted = true;
            });
            browserA.on('error', function() {
                isErrorHandlerEmitted = true;
            });
            browserA.on('command', function(e) {

                // assign variables only on first command
                if (isCommandHandlerEmitted) {
                    return;
                }

                isCommandHandlerEmitted = true;
                desiredCapabilties = e.data.desiredCapabilities.browserName;
                uri = e.uri;
            });
        });

        it('should emit an init event after calling the init command', function(done) {
            browserA
                .init()
                .call(function() {
                    assert.ok(isInitHandlerEmitted, 'init handler wasn\'t called');
                    assert.strictEqual(uri.host, 'localhost:4444');
                    assert.strictEqual(desiredCapabilties, 'phantomjs');
                })
                .call(done);
        });

        it('should emit an error event after querying a non existing element', function(done) {

            browserA
                .url(conf.testPage.start)
                // click on non existing element to cause an error
                .click('#notExistentant', function(err) {
                    assert(err.message.match(/Problem: Unable to find element with id 'notExistentant'/));
                })
                .call(function() {
                    assert.ok(isErrorHandlerEmitted, 'error handler wasn\'t called');
                })
                .call(done);

        });

        it('should emit an end event after calling the end command', function(done) {

            browserA
                .end()
                .call(function() {
                    assert.ok(isEndHandlerEmitted, 'end handler wasn\'t called');
                })
                .call(done);

        });
    });

    describe('costume events', function() {
        var iShouldBeGetTriggered = false,
            eventWasTriggeredAtLeastOnce = false;

        before(h.setupMultibrowser());

        beforeEach(function() {
            iShouldBeGetTriggered = 0;
            eventWasTriggeredAtLeastOnce = false;
            this.browserA.removeAllListeners('testme');
        });

        it('should register and fire events with on/emit', function(done) {

            this.browserA
                .emit('testme')
                .on('testme', function() {
                    iShouldBeGetTriggered.should.be.true;
                    eventWasTriggeredAtLeastOnce = true;
                })
                .call(function() {
                    iShouldBeGetTriggered = true;
                })
                .emit('testme')
                .call(function() {
                    if (eventWasTriggeredAtLeastOnce) {
                        done();
                    } else {
                        done(new Error('event wasn\'t thrown'));
                    }
                });

        });

        it('should register and fire events with once/emit', function(done) {

            this.browserA
                .once('testme', function() {
                    ++iShouldBeGetTriggered;
                    iShouldBeGetTriggered.should.be.equal(1);
                })
                .emit('testme')
                .emit('testme')
                .call(done);

        });
    });
});