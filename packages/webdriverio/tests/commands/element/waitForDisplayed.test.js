import got from 'got'
import { remote } from '../../../src'

describe('waitForDisplayed', () => {
    const timeout = 1000
    let browser

    beforeEach(async () => {
        got.mockClear()

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
            selector: '#foo',
            waitForDisplayed: tmpElem.waitForDisplayed,
            elementId: 123,
            waitUntil: jest.fn().mockImplementation(cb),
            options : { waitforInterval: 5, waitforTimeout: timeout }
        }

        await elem.waitForDisplayed({ timeout })
        expect(cb).toBeCalled()
        expect(elem.waitUntil.mock.calls).toMatchSnapshot()
    })

    test('should call isDisplayed and return true immediately if true', async () => {
        const elem = await browser.$('#foo')
        const result = await elem.waitForDisplayed({ timeout })

        expect(result).toBe(true)
        expect(got.mock.calls[2][0].pathname)
            .toBe('/session/foobar-123/element/some-elem-123/displayed')
    })

    test('should call isDisplayed and return true if eventually true', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector: '#foo',
            waitForDisplayed: tmpElem.waitForDisplayed,
            elementId: 123,
            waitUntil: tmpElem.waitUntil,
            isDisplayed: jest.fn()
                .mockImplementationOnce(() => false)
                .mockImplementationOnce(() => false)
                .mockImplementationOnce(() => true),
            options: { waitforTimeout: 50, waitforInterval: 5 },
        }

        const result = await elem.waitForDisplayed({ timeout })
        expect(result).toBe(true)
    })

    test('should call isDisplayed and return false', async () => {
        expect.assertions(1)
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector: '#foo',
            waitForDisplayed: tmpElem.waitForDisplayed,
            elementId: 123,
            waitUntil: tmpElem.waitUntil,
            isDisplayed: jest.fn(() => false),
            options: { waitforTimeout: 500, waitforInterval: 50 },
        }

        try {
            await elem.waitForDisplayed({ timeout })
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not displayed after ${timeout}ms`)
        }
    })

    test('should not call isDisplayed and return false if never found', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector: '#foo',
            parent: { $: jest.fn(() => { return elem}) },
            waitForDisplayed: tmpElem.waitForDisplayed,
            waitUntil: tmpElem.waitUntil,
            isDisplayed: tmpElem.isDisplayed,
            options: { waitforTimeout: 500, waitforInterval: 50 },
        }

        try {
            await elem.waitForDisplayed({ timeout })
        } catch (e) {
            expect(e.message).toBe(`element ("#foo") still not displayed after ${timeout}ms`)
        }
    })

    test('should do reverse', async () => {
        const cb = jest.fn()
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector: '#foo',
            waitForDisplayed: tmpElem.waitForDisplayed,
            elementId: 123,
            waitUntil: jest.fn().mockImplementation(cb),
            isDisplayed: jest.fn(() => true),
            options: { waitforTimeout: 500, waitforInterval: 50 },
        }

        await elem.waitForDisplayed({ reverse: true })
        expect(elem.waitUntil.mock.calls).toMatchSnapshot()
    })

    test('should call isDisplayed and return false with custom error', async () => {
        expect.assertions(1)
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector: '#foo',
            waitForDisplayed: tmpElem.waitForDisplayed,
            elementId: 123,
            waitUntil: tmpElem.waitUntil,
            isDisplayed: jest.fn(() => false),
            options: { waitforTimeout: 500 },
        }

        try {
            await elem.waitForDisplayed({ timeout, timeoutMsg: 'Element foo never displayed' })
        } catch (e) {
            expect(e.message).toBe('Element foo never displayed')
        }
    })
})
