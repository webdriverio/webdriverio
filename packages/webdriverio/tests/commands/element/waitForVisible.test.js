import request from 'request'
import { remote } from '../../../src'

describe('waitUntil', () => {
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
        const tmpElem = await browser.$(`#foo`)
        const elem = {
            waitForVisible : tmpElem.waitForVisible,
            waitForExist : jest.fn(),
            elementId : null,
            waitUntil : jest.fn(),
            isElementDisplayed : jest.fn(() => Promise.resolve())
        }

        await elem.waitForVisible(duration)
        expect(elem.waitForExist).toBeCalled()
    })

    test('element should already exist on the page', async () => {
        const tmpElem = await browser.$(`#foo`)
        const elem = {
            waitForVisible : tmpElem.waitForVisible,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : jest.fn(),
            isElementDisplayed : jest.fn(() => Promise.resolve())
        }

        await elem.waitForVisible(duration)
        expect(elem.waitForExist).not.toBeCalled()
    })

    test('should call waitUntil', async () => {
        const cb = jest.fn()
        const tmpElem = await browser.$(`#foo`)
        const elem = {
            selector : '#foo',
            waitForVisible : tmpElem.waitForVisible,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : jest.fn(((cb))),
            isElementDisplayed : jest.fn(() => Promise.resolve())
        }

        await elem.waitForVisible(duration)

        expect(cb).toBeCalled()
        expect(elem.waitUntil.mock.calls[0][1]).toBe(duration)
        expect(elem.waitUntil.mock.calls[0][2]).toBe(`element ("#foo") still not visible after ${duration}ms`)
    })

    test('should call isElementDisplayed and return true', async () => {
        const elem = await browser.$(`#foo`)
        const result = await elem.waitForVisible(duration)

        expect(result).toBe(true)
        expect(request.mock.calls[5][0].uri.path).toBe('/wd/hub/session/foobar-123/element/some-elem-123/displayed')
    })

    test('aaaaashould call isElementDisplayed and return false', async () => {
        const tmpElem = await browser.$(`#foo`)
        const elem = {
            selector : '#foo',
            waitForVisible : tmpElem.waitForVisible,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isElementDisplayed : jest.fn(() => true),
            options : { waitforTimeout : 500 },
        }

        const result = await elem.waitForVisible(duration)
        expect(result).toBe(true)
        /*
        try {
            await elem.waitForVisible(duration)
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not visible after ${duration}ms`)
        }
        */
    })

    test('should call isElementDisplayed and return false', async () => {
        const tmpElem = await browser.$(`#foo`)
        const elem = {
            selector : '#foo',
            waitForVisible : tmpElem.waitForVisible,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isElementDisplayed : jest.fn(() => false),
            options : { waitforTimeout : 500 },
        }

        try {
            await elem.waitForVisible(duration)
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not visible after ${duration}ms`)
        }
    })

    test('should do reverse', async () => {
        const cb = jest.fn()
        const tmpElem = await browser.$(`#foo`)
        const elem = {
            selector : '#foo',
            waitForVisible : tmpElem.waitForVisible,
            waitForExist : jest.fn(),
            elementId : 123,
            waitUntil : jest.fn(((cb))),
            isElementDisplayed : jest.fn(() => Promise.resolve()),
            options : { waitforTimeout : 500 },
        }

        await elem.waitForVisible(null, true)

        expect(elem.waitUntil.mock.calls[0][1]).toBe(elem.options.waitforTimeout)
        expect(elem.waitUntil.mock.calls[0][2]).toBe(`element ("#foo") still ${``} visible after ${elem.options.waitforTimeout}ms`)
    })
})