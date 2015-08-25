var webdriverjs = require('../../../index.js'),
    conf = require('../../conf/index.js'),
    tmpConf = {
        'phantom1': {
            desiredCapabilities: {
                browserName: 'phantomjs'
            }
        },
        'phantom2': {
            desiredCapabilities: {
                browserName: 'phantomjs'
            }
        }
    };

describe('event handling', function() {

    describe('is able to emit and listen to driver specific events and', function() {

        var isCommandHandlerEmitted = false,
            isErrorHandlerEmitted = false,
            isInitHandlerEmitted = false,
            isEndHandlerEmitted = false,
            desiredCapabilties = null,
            matrix;

        before(function() {
            matrix = webdriverjs.multiremote(tmpConf);

            matrix.on('end', function() {
                isEndHandlerEmitted = true;
            });

            matrix.on('init', function(e) {
                isInitHandlerEmitted = true;
                desiredCapabilties = e.phantom1.value.browserName;
            });
            matrix.on('error', function() {
                isErrorHandlerEmitted = true;
            });
            matrix.on('command', function() {

                // assign variables only on first command
                if (isCommandHandlerEmitted) {
                    return;
                }

                isCommandHandlerEmitted = true;
            });
        });

        it('should emit an init event after calling the init command', function() {
            return matrix
                .init()
                .call(function() {
                    assert.ok(isInitHandlerEmitted, 'init handler wasn\'t called');
                    assert.strictEqual(desiredCapabilties, 'phantomjs');
                });
        });

        it('should emit an error event after querying a non existing element', function() {
            return matrix
                .url(conf.testPage.start)
                // click on non existing element to cause an error
                .click('#notExistentant').catch(function(err) {
                    expect(err.message).to.be.equal('Unable to find element with id \'notExistentant\'');
                })
                .call(function() {
                    assert.ok(isErrorHandlerEmitted, 'error handler wasn\'t called');
                });
        });

        it('should emit an end event after calling the end command', function() {
            matrix.end();
            matrix.call(function() {
                assert.ok(isEndHandlerEmitted, 'end handler wasn\'t called');
            });
        });

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