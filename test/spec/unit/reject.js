import { remote } from '../../../index'
import { tmpdir } from 'os'

let client

describe('rejection', () => {
    before(async () => {
        client = remote({
            screenshotPath: tmpdir()
        })

        const createSession = global.mock('post', '/session')
        await client.init()
        createSession.isDone().should.be.true
    })

    it('should not take screenshot if rejection handler is provided foobar', () => {
        mock('post', '/session/123ABC/element', { value: { error: 'no such element' } }, undefined, 404)

        let screenshot
        client.on('screenshot', data => {
            screenshot = data
        })

        return client.click('.missing')
            .catch(e => {
                expect(screenshot).to.be.undefined
                expect(e.message).to.match(/An element could not be located/)
            })
    })

    it('should take screenshot if there is no error handler', () => {
        mock('post', '/session/123ABC/element', { status: 7 })
        mock('get', '/session/123ABC/screenshot', { status: 0, value: '' })

        let screenshot
        client.on('screenshot', data => {
            screenshot = data
        })

        return client.click('.missing')
            .then(() => { throw new Error('Unexpected success') })
            .catch(e => expect(screenshot).not.to.be.undefined)
    })

    it('should prevent infinite loop when screenhot attempt has failed', () => {
        mock('post', '/session/123ABC/element', { status: 7 })
        mock('get', '/session/123ABC/screenshot', { status: 6 })

        let screenshot
        client.on('screenshot', data => {
            screenshot = data
        })

        return client.click('.missing')
            .then(() => { throw new Error('Unexpected success') })
            .catch(e => {
                expect(screenshot).to.be.undefined
            })
    })
})
