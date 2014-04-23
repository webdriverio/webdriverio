var webdriverjs = require('../../index.js'),
    conf        = require('../conf/index.js'),
    tmpConf     = { desiredCapabilities: { browserName: 'phantomjs' }},
    client;

describe('event handling', function () {
    describe('test webdriverjs events (init/command/error/end)', function () {

        var isCommandHandlerEmitted = false,
            isErrorHandlerEmitted = false,
            isInitHandlerEmitted = false,
            isEndHandlerEmitted = false,
            commandUrl = null,
            desiredCapabilties = null,
            client;

        before(function() {
            client = webdriverjs.remote(tmpConf);

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
                    assert.strictEqual(commandUrl,'http://127.0.0.1:4444/wd/hub/session');
                    assert.strictEqual(desiredCapabilties,'phantomjs');
                })
                .call(done);
        });

        it.skip('should emit an error event', function(done) {
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

    describe('costume events', function() {
        var iShouldBeGetTriggered = false,
            eventWasTriggeredAtLeastOnce = false;

        before(h.setup);

        beforeEach(function() {
            iShouldBeGetTriggered = false;
            eventWasTriggeredAtLeastOnce = false;
            this.client.removeAllListeners('testme');
        })

        it('should register and fire events with on/emit', function(done) {

            this.client
                .emit('testme')
                .on('testme', function() {
                    assert.ok(iShouldBeGetTriggered,'event was triggered unexpected');
                    eventWasTriggeredAtLeastOnce = true;
                })
                .call(function() {
                    iShouldBeGetTriggered = true;
                })
                .emit('testme')
                .call(function() {
                    if(eventWasTriggeredAtLeastOnce) {
                        done();
                    } else {
                        done(new Error('event wasn\'t thrown'));
                    }
                })

        });

        it('should register and fire events with once/emit', function(done) {

            this.client
                .once('testme', function() {
                    assert.ok(iShouldBeGetTriggered,'event was triggered unexpected');
                    assert.ok(!eventWasTriggeredAtLeastOnce, 'once event got triggered twice');
                    eventWasTriggeredAtLeastOnce = true;
                })
                .call(function() {
                    iShouldBeGetTriggered = true;
                })
                .emit('testme')
                .emit('testme')
                .call(done);

        });

        it('two instances should have different event handlers', function() {
            var clientA = webdriverjs.remote(tmpConf);
            var clientB = webdriverjs.remote(tmpConf);

            clientA.on('testme', function(key) {
                assert.strictEqual(key,'A');
            });
            clientB.on('testme', function(key) {
                assert.strictEqual(key,'B');
            })

            clientA.emit('testme','A');
            clientB.emit('testme','B');
        })
    })
});