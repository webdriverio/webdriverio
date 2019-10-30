import request from 'request'
import { remote } from '../../../src'
import { ELEMENT_KEY } from '../../../src/constants'

describe('custom$', () => {
    let browser

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    afterEach(() => {
        browser = null
    })

    it('should fetch element', async () => {
        browser.addLocatorStrategy('test', function testLocatorStrategy() {})

        const elem = await browser.custom$('test', '.foo')

        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/execute/sync')
        expect(elem.elementId).toBe('some-elem-123')
        expect(elem[ELEMENT_KEY]).toBe('some-elem-123')
        expect(elem.ELEMENT).toBe(undefined)
    })

    it('should error if no strategy found', async () => {
        try {
            await browser.custom$('test-fail', '.foo')
        } catch (error) {
            expect(error.message).toBe('No strategy found for test-fail')
        }
    })

    it('should fetch element one element even if the script returns multiple', async () => {
        browser.addLocatorStrategy('test', function testLocatorStrategiesMultiple() {})

        const elem = await browser.custom$('test', '.foo')

        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/execute/sync')
        expect(elem.elementId).toBe('some-elem-123')
        expect(elem[ELEMENT_KEY]).toBe('some-elem-123')
        expect(elem.ELEMENT).toBe(undefined)
    })

    it('should throw error if no element is returned from the user script', async () => {
        browser.addLocatorStrategy('test-no-element', function testLocatorStrategiesNoElement() {})

        try {
            await browser.custom$('test-no-element', '.foo')
        } catch (error) {
            expect(error.message).toBe('Your locator strategy script must return an element')
        }
    })
})