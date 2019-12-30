import got from 'got'
import { remote } from '../../../src'

describe('waitForEnabled', () => {
    const timeout = 1000
    let browser

    beforeAll(async () => {
        got.mockClear()

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
            options : { waitforInterval: 5, waitforTimeout: timeout }
        }

        await elem.waitForEnabled({ timeout })
        expect(elem.waitForExist).toBeCalled()
    })

    test('element should already exist on the page', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForEnabled : tmpElem.waitForEnabled,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : jest.fn(),
            isEnabled : jest.fn(() => Promise.resolve()),
            options : { waitforInterval: 5, waitforTimeout: timeout }
        }

        await elem.waitForEnabled({ timeout })
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
            isEnabled : jest.fn(() => Promise.resolve()),
            options : { waitforInterval: 5, waitforTimeout: timeout }
        }

        await elem.waitForEnabled({ timeout })

        expect(cb).toBeCalled()
        expect(elem.waitUntil.mock.calls).toMatchSnapshot()
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
            options : { waitforInterval: 5, waitforTimeout: timeout }
        }

        const result = await elem.waitForEnabled({ timeout })
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
            options : { waitforInterval: 5, waitforTimeout: timeout }
        }

        try {
            await elem.waitForEnabled({ timeout })
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not enabled after ${timeout}ms`)
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
            options : { waitforInterval: 50, waitforTimeout: 500 }
        }

        await elem.waitForEnabled({ reverse: true })
        expect(elem.waitUntil.mock.calls).toMatchSnapshot()
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
            await elem.waitForEnabled({
                timeout,
                reverse: false,
                timeoutMsg: 'Element foo never enabled'
            })
        } catch (e) {
            expect(e.message).toBe('Element foo never enabled')
        }
    })
})
