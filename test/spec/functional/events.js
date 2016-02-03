import { remote } from '../../../index.js'
import conf from '../../conf/index.js'

const tmpConf = {
    desiredCapabilities: {
        browserName: 'phantomjs'
    }
}

describe('event handling', () => {
    describe('is able to emit and listen to driver specific events and', () => {
        let isCommandHandlerEmitted = false
        let isErrorHandlerEmitted = false
        let isInitHandlerEmitted = false
        let isEndHandlerEmitted = false
        let uri = null
        let desiredCapabilties = null
        let client

        before(() => {
            client = remote(tmpConf)

            client.on('end', () => {
                isEndHandlerEmitted = true
            })
            client.on('init', () => {
                isInitHandlerEmitted = true
            })
            client.on('error', () => {
                isErrorHandlerEmitted = true
            })
            client.on('command', (e) => {
                // assign variables only on first command
                if (isCommandHandlerEmitted) {
                    return
                }

                isCommandHandlerEmitted = true
                desiredCapabilties = e.data.desiredCapabilities.browserName
                uri = e.uri
            })
        })

        it('should emit an init event after calling the init command', async () => {
            await client.init()
            isInitHandlerEmitted.should.be.true
            uri.host.should.be.equal('127.0.0.1:4444')
            desiredCapabilties.should.be.equal('phantomjs')
        })

        /**
         * we don't throw error events anymore since they screw up the reporter
         * output. Use onError handlers instead
         */
        it.skip('should emit an error event after querying a non existing element', async () => {
            await client.url(conf.testPage.start)

            // click on non existing element to cause an error
            try {
                await client.click('#notExistent')
            } catch (e) {}

            isErrorHandlerEmitted.should.be.true
        })

        it('should emit an end event after calling the end command', async () => {
            await client.end()
            isEndHandlerEmitted.should.be.true
        })

        /**
         * we don't throw error events anymore since they screw up the reporter
         * output. Use onError handlers instead
         */
        it.skip('should emit custom command events', async () => {
            isErrorHandlerEmitted = false
            client.addCommand('throwMe', () => {
                throw new Error('uups')
            })

            try {
                await client.throwMe()
            } catch (e) {}

            isErrorHandlerEmitted.should.be.true
        })
    })

    describe('custom events', () => {
        let iWasTriggered = false
        let eventWasTriggeredAtLeastOnce = false

        beforeEach(function () {
            iWasTriggered = false
            eventWasTriggeredAtLeastOnce = false
            this.client.removeAllListeners('testme')
        })

        it('should register and fire events with on/emit', function () {
            return this.client
                .emit('testme')
                .on('testme', async function () {
                    iWasTriggered.should.be.true
                    eventWasTriggeredAtLeastOnce = true
                })
                .call(function () {
                    iWasTriggered = true
                })
                .emit('testme')
                .call(() => eventWasTriggeredAtLeastOnce.should.be.true)
        })

        it('should register and fire events with once/emit', function () {
            return this.client
                .once('testme', async function () {
                    iWasTriggered.should.be.true
                    eventWasTriggeredAtLeastOnce.should.be.false
                    eventWasTriggeredAtLeastOnce = true
                })
                .call(function () {
                    iWasTriggered = true
                })
                .emit('testme')
                .emit('testme')
        })

        it('two instances should have different event handlers', async function () {
            const clientA = remote(tmpConf)
            const clientB = remote(tmpConf)

            clientA.on('testme', (key) => key.should.be.equal('A'))
            clientB.on('testme', (key) => key.should.be.equal('B'))

            clientA.emit('testme', 'A')
            clientB.emit('testme', 'B')

            await clientA.end()
            await clientB.end()
        })
    })
})
