import { remote } from '../../../src'

describe('waitForClickable', () => {
    const duration = 1000
    let browser

    beforeEach(async () => {
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
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : jest.fn(((cb))),
            options : { waitforInterval: 5, waitforTimeout: duration }
        }

        await elem.waitForClickable()

        expect(cb).toBeCalled()
        expect(elem.waitUntil.mock.calls).toMatchSnapshot()
    })

    test('should call isClickable and return true immediately if true', async () => {
        const elem = await browser.$('#foo')
        delete elem.isClickable
        elem.isClickable = jest.fn().mockImplementationOnce(() => true)
        const result = await elem.waitForClickable({ timeout: duration })

        expect(result).toBe(true)
    })

    test('should call isClickable and return true if eventually true', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isClickable : jest.fn()
                .mockImplementationOnce(() => false)
                .mockImplementationOnce(() => false)
                .mockImplementationOnce(() => true),
            options : { waitforTimeout : 50, waitforInterval: 5 },
        }

        const result = await elem.waitForClickable({ timeout: duration })
        expect(result).toBe(true)
    })

    test('should call isClickable and return false', async () => {
        expect.assertions(1)
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isClickable : jest.fn(() => false),
            options : { waitforTimeout : 500, waitforInterval: 50 },
        }

        try {
            await elem.waitForClickable({ timeout: duration })
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not clickable after ${duration}ms`)
        }
    })

    test('should not call isClickable and return false if never found', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            parent: { $: jest.fn(() => { return elem}) },
            waitForClickable : tmpElem.waitForClickable,
            waitUntil : tmpElem.waitUntil,
            isDisplayed : tmpElem.isDisplayed,
            isClickable : tmpElem.isClickable,
            options : { waitforTimeout : 500, waitforInterval: 50 },
        }

        try {
            await elem.waitForClickable({ timeout: duration })
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not clickable after ${duration}ms`)
        }
    })

    test('should do reverse', async () => {
        const cb = jest.fn()
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : jest.fn(((cb))),
            isClickable : jest.fn(() => true),
            options : { waitforTimeout : 500, waitforInterval: 50 },
        }

        await elem.waitForClickable({ reverse: true })

        expect(elem.waitUntil.mock.calls).toMatchSnapshot()
    })

    test('should call isClickable and return false with custom error', async () => {
        expect.assertions(1)
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector : '#foo',
            waitForClickable : tmpElem.waitForClickable,
            elementId : 123,
            waitUntil : tmpElem.waitUntil,
            isClickable : jest.fn(() => false),
            options : { waitforTimeout : 500, waitforInterval: 50 },
        }

        try {
            await elem.waitForClickable({ timeout: duration, timeoutMsg: 'Element foo never clickable' })
        } catch (e) {
            expect(e.message).toBe('Element foo never clickable')
        }
    })
})
