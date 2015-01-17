var WebdriverIO = require('../../../index.js'),
    conf = require('../../conf/index.js');

/* global beforeEach */
describe('event handling', function() {
    describe('is able to emit and listen to driver specific events and', function() {

        var isCommandHandlerEmitted = 0,
            isErrorHandlerEmitted = 0,
            isInitHandlerEmitted = 0,
            isEndHandlerEmitted = 0,
            uri = null,
            desiredCapabilties = null,
            matrix;

        before(function() {
            matrix = WebdriverIO.multiremote(conf.capabilities);

            matrix.on('end', function() {
                isEndHandlerEmitted++;
            });
            matrix.on('init', function() {
                isInitHandlerEmitted++;
            });
            matrix.on('error', function() {
                isErrorHandlerEmitted++;
            });
            matrix.on('command', function(e) {

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
            matrix
                .init()
                .call(function() {
                    isInitHandlerEmitted.should.be.equal(2);
                    assert.strictEqual(uri.host, 'localhost:4444');
                    assert.strictEqual(desiredCapabilties, 'phantomjs');
                })
                .call(done);
        });

        it('should emit an error event after querying a non existing element', function(done) {

            matrix
                .url(conf.testPage.start)
                // click on non existing element to cause an error
                .click('#notExistentant', function(err) {
                    assert(err.browserA.message.match(/Problem: Unable to find element with id 'notExistentant'/));
                })
                .call(function() {
                    isErrorHandlerEmitted.should.be.equal(2);
                })
                .call(done);

        });

        it('should emit an end event after calling the end command', function(done) {

            matrix
                .end()
                .call(function() {
                    isEndHandlerEmitted.should.be.equal(2);
                })
                .call(done);

        });

        after(function() {
            matrix.removeAllListeners();
            matrix.end();
        })
    });

    describe('costume events', function() {
        var iShouldBeGetTriggered = false,
            eventWasTriggeredAtLeastOnce = false;

        before(h.setupMultibrowser());

        beforeEach(function() {
            iShouldBeGetTriggered = 0;
            eventWasTriggeredAtLeastOnce = false;
            this.matrix.removeAllListeners('testme');
        });

        it('should register and fire events with on/emit', function(done) {

            this.matrix
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

            this.matrix
                .once('testme', function() {
                    ++iShouldBeGetTriggered;
                    iShouldBeGetTriggered.should.be.within(1, 2);
                })
                .emit('testme')
                .emit('testme')
                .call(done);

        });
    });
});