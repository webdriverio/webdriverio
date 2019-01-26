import request from 'request'
import { remote } from '../../../src'

describe('waitForDisplayed', () => {
    const duration = 1000
    let browser

    beforeEach(async () => {
        request.mockClear()

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    test('should call waitUntil', async () => {
        const cb = jest.fn()
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForDisplayed : tmpElem.waitForDisplayed,
            elementId : 123,
            waitUntil : jest.fn(((cb))),
        }

        await elem.waitForDisplayed(duration)

        expect(cb).toBeCalled()
        expect(elem.waitUntil.mock.calls[0][1]).toBe(duration)
        expect(elem.waitUntil.mock.calls[0][2]).toBe(`element ("#foo") still not displayed after ${duration}ms`)
    })

    test('should call isDisplayed and return true immediately if true', async () => {
        const elem = await browser.$('#foo')
        const result = await elem.waitForDisplayed(duration)

        expect(result).toBe(true)
        expect(request.mock.calls[2][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/displayed')
    })

    test('should call isDisplayed and return true if eventually true', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForDisplayed : tmpElem.waitForDisplayed,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isDisplayed : jest.fn()
                .mockImplementationOnce(() => false)
                .mockImplementationOnce(() => false)
                .mockImplementationOnce(() => true),
            options : { waitforTimeout : 50, waitforInterval: 5 },
        }

        const result = await elem.waitForDisplayed(duration)
        expect(result).toBe(true)
    })

    test('should call isDisplayed and return false', async () => {
        expect.assertions(1)
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForDisplayed : tmpElem.waitForDisplayed,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isDisplayed : jest.fn(() => false),
            options : { waitforTimeout : 500 },
        }

        try {
            await elem.waitForDisplayed(duration)
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not displayed after ${duration}ms`)
        }
    })

    test('should not call isDisplayed and return false if never found', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            parent: { $: jest.fn(() => { return elem}) },
            waitForDisplayed : tmpElem.waitForDisplayed,
            waitUntil : tmpElem.waitUntil,
            isDisplayed : tmpElem.isDisplayed,
            options : { waitforTimeout : 500 },
        }

        try {
            await elem.waitForDisplayed(duration)
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not displayed after ${duration}ms`)
        }
    })

    test('should do reverse', async () => {
        const cb = jest.fn()
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForDisplayed : tmpElem.waitForDisplayed,
            elementId : 123,
            waitUntil : jest.fn(((cb))),
            isDisplayed : jest.fn(() => true),
            options : { waitforTimeout : 500 },
        }

        await elem.waitForDisplayed(null, true)

        expect(elem.waitUntil.mock.calls[0][1]).toBe(elem.options.waitforTimeout)
        expect(elem.waitUntil.mock.calls[0][2]).toBe(`element ("#foo") still displayed after ${elem.options.waitforTimeout}ms`)
    })

    test('should call isDisplayed and return false with custom error', async () => {
        expect.assertions(1)
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForDisplayed : tmpElem.waitForDisplayed,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isDisplayed : jest.fn(() => false),
            options : { waitforTimeout : 500 },
        }

        try {
            await elem.waitForDisplayed(duration, false, 'Element foo never displayed')
        } catch (e) {
            expect(e.message).toBe('Element foo never displayed')
        }
    })
})
