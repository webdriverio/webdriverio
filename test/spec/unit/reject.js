import { remote } from '../../../index'
import { tmpdir } from 'os'

describe('rejection', () => {
    before(async function() {
        this.client = remote({
            screenshotPath: tmpdir()
        })

        const createSession = global.mock('post', '/session')
        await this.client.init()
        createSession.isDone().should.be.true
    })

    it('should not take screenshot if rejection handler is provided', function () {
        mock('post', '/session/123ABC/element', { status: 7 })

        let screenshot
        this.client.on('screenshot', data => {
            screenshot = data
        })

        return this.client.click('.missing')
            .catch(e => {
                expect(screenshot).to.be.undefined
                expect(e.message).to.match(/An element could not be located/)
            })
    })

    it('should take screenshot if there is no error handler', function () {
        mock('post', '/session/123ABC/element', { status: 7 })
        mock('get', '/session/123ABC/screenshot', { status: 0, value: '' })

        let screenshot
        this.client.on('screenshot', data => {
            screenshot = data
        })

        return this.client.click('.missing')
            .then(() => { throw new Error('Unexpected success') })
            .catch(e => {
                expect(screenshot).to.be.defined
            })
    })

    it('should prevent infinite loop when screenhot attempt has failed', function () {
        mock('post', '/session/123ABC/element', { status: 7 })
        mock('get', '/session/123ABC/screenshot', { status: 6 })

        let screenshot
        this.client.on('screenshot', data => {
            screenshot = data
        })

        return this.client.click('.missing')
            .then(() => { throw new Error('Unexpected success') })
            .catch(e => {
                expect(screenshot).to.be.undefined
            })
    })
})
