import request from 'request'
import { remote } from '../../../src'

describe('waitForEnabled', () => {
    const duration = 1000
    let browser

    beforeAll(async () => {
        request.mockClear()

        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
    })

    test('should wait for the element to exist', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForEnabled : tmpElem.waitForEnabled,
            waitForExist : jest.fn(),
            elementId : null,
            waitUntil : jest.fn(),
            isEnabled : jest.fn(() => Promise.resolve())
        }

        await elem.waitForEnabled(duration)
        expect(elem.waitForExist).toBeCalled()
    })

    test('element should already exist on the page', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForEnabled : tmpElem.waitForEnabled,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : jest.fn(),
            isEnabled : jest.fn(() => Promise.resolve())
        }

        await elem.waitForEnabled(duration)
        expect(elem.waitForExist).not.toBeCalled()
    })

    test('should call waitUntil', async () => {
        const cb = jest.fn()
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForEnabled : tmpElem.waitForEnabled,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : jest.fn(((cb))),
            isEnabled : jest.fn(() => Promise.resolve())
        }

        await elem.waitForEnabled(duration)

        expect(cb).toBeCalled()
        expect(elem.waitUntil.mock.calls[0][1]).toBe(duration)
        expect(elem.waitUntil.mock.calls[0][2]).toBe(`element ("#foo") still not enabled after ${duration}ms`)
    })

    test('should call isEnabled and return true', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForEnabled : tmpElem.waitForEnabled,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isEnabled : jest.fn(() => true),
            options : { waitforTimeout : 500 },
        }

        const result = await elem.waitForEnabled(duration)
        expect(result).toBe(true)
    })

    test('should call isEnabled and return false', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForEnabled : tmpElem.waitForEnabled,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isEnabled : jest.fn(() => false),
            options : { waitforTimeout : 500 },
        }

        try {
            await elem.waitForEnabled(duration)
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not enabled after ${duration}ms`)
        }
    })

    test('should do reverse', async () => {
        const cb = jest.fn()
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForEnabled : tmpElem.waitForEnabled,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : jest.fn(((cb))),
            isEnabled : jest.fn(() => Promise.resolve()),
            options : { waitforTimeout : 500 },
        }

        await elem.waitForEnabled(null, true)

        expect(elem.waitUntil.mock.calls[0][1]).toBe(elem.options.waitforTimeout)
        expect(elem.waitUntil.mock.calls[0][2]).toBe(`element ("#foo") still enabled after ${elem.options.waitforTimeout}ms`)
    })

    test('should call isEnabled and return false with custom error', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForEnabled : tmpElem.waitForEnabled,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isEnabled : jest.fn(() => false),
            options : { waitforTimeout : 500 },
        }

        try {
            await elem.waitForEnabled(duration, false, 'Element foo never enabled')
        } catch (e) {
            expect(e.message).toBe('Element foo never enabled')
        }
    })
})
