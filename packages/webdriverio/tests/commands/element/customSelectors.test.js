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
        browser.addLocatorStrategy('test', function testLocatorStrategiesMultiple() { })

        const elem = await browser.$('#foo')
        const elems = await elem.custom$$('test', '.test')

        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
        expect(elems[0].elementId).toBe('some-elem-123')
        expect(elems[0][ELEMENT_KEY]).toBe('some-elem-123')
        expect(elems[0].ELEMENT).toBe(undefined)

        expect(elems[1].elementId).toBe('some-elem-456')
        expect(elems[1][ELEMENT_KEY]).toBe('some-elem-456')
        expect(elems[1].ELEMENT).toBe(undefined)

        expect(elems[2].elementId).toBe('some-elem-789')
        expect(elems[2][ELEMENT_KEY]).toBe('some-elem-789')
        expect(elems[2].ELEMENT).toBe(undefined)
    })

    it('should error if no strategy found', async () => {
        const err = await browser.custom$$('test', '.foo').catch(err => err)

        expect(err.message).toBe('No strategy found for test')
    })

    it('should return array even if the script returns one element', async () => {
        browser.addLocatorStrategy('test', function testLocatorStrategy() {})

        const elem = await browser.$('#foo')
        const elems = await elem.custom$$('test', '.test')

        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.path).toBe('/wd/hub/session/foobar-123/element')
        expect(elems[0].elementId).toBe('some-elem-123')
        expect(elems[0][ELEMENT_KEY]).toBe('some-elem-123')
        expect(elems[0].ELEMENT).toBe(undefined)
    })

    it('should return an empty array if no elements are returned from script', async () => {
        browser.addLocatorStrategy('test-no-element', function testLocatorStrategiesNoElement() {})

        const elem = await browser.$('#foo')
        const res = await elem.custom$$('test-no-element', '.test')

        expect(res).toMatchObject([])
    })
})