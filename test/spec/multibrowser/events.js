import { multiremote } from '../../../index.js'
import conf from '../../conf/index.js'

const tmpConf = {
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
}

describe('event handling', () => {
    describe('is able to emit and listen to driver specific events and', () => {
        let isCommandHandlerEmitted = false
        let isErrorHandlerEmitted = false
        let isInitHandlerEmitted = false
        let isEndHandlerEmitted = false
        let desiredCapabilties = null
        let matrix

        before(() => {
            matrix = multiremote(tmpConf)

            matrix.on('end', () => {
                isEndHandlerEmitted = true
            })

            matrix.on('init', (e) => {
                isInitHandlerEmitted = true
                desiredCapabilties = e.phantom1.value.browserName
            })
            matrix.on('error', () => {
                isErrorHandlerEmitted = true
            })
            matrix.on('command', () => {
                // assign variables only on first command
                if (isCommandHandlerEmitted) {
                    return
                }

                isCommandHandlerEmitted = true
            })
        })

        it('should emit an init event after calling the init command', async () => {
            await matrix.init()
            isInitHandlerEmitted.should.be.true
            desiredCapabilties.should.be.equal('phantomjs')
        })

        it('should emit an error event after querying a non existing element', async () => {
            await matrix.url(conf.testPage.start)

            // click on non existing element to cause an error
            try {
                await matrix.click('#notExistentant')
            } catch (err) {
                expect(err.message).to.be.equal('Unable to find element with id \'notExistentant\'')
            } finally {
                isErrorHandlerEmitted.should.be.true
            }
        })

        it('should emit an end event after calling the end command', async () => {
            await matrix.end()
            isEndHandlerEmitted.should.be.true
        })
    })

    describe('costume events', () => {
        let iShouldBeGetTriggered = false
        let eventWasTriggeredAtLeastOnce = false

        beforeEach(function () {
            iShouldBeGetTriggered = 0
            eventWasTriggeredAtLeastOnce = false
            this.client.removeAllListeners('testme')
        })

        it('should register and fire events with on/emit', function (done) {
            this.client
                .emit('testme')
                .on('testme', () => {
                    iShouldBeGetTriggered.should.be.true
                    eventWasTriggeredAtLeastOnce = true
                })
                .call(() => {
                    iShouldBeGetTriggered = true
                })
                .emit('testme')
                .call(() => {
                    if (eventWasTriggeredAtLeastOnce) {
                        return done()
                    }

                    return done(new Error('event wasn\'t thrown'))
                })
        })

        it('should register and fire events with once/emit', function (done) {
            this.client
                .once('testme', () => {
                    ++iShouldBeGetTriggered
                    iShouldBeGetTriggered.should.be.within(1, 2)
                })
                .emit('testme')
                .emit('testme')
                .call(done)
        })
    })
})
