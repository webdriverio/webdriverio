import request from 'request'
import { remote } from '../../../src'

describe('waitForExists', () => {
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

    test('should wait for the element to exist', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector: 'foobar',
            waitForExist : tmpElem.waitForExist,
            isExisting: jest.fn().mockReturnValueOnce(Promise.resolve(true)),
            elementId : null,
            waitUntil : jest.fn().mockImplementation(
                (condition) => condition.call(elem)),
            isElementDisplayed : jest.fn(() => Promise.resolve())
        }

        await elem.waitForExist(duration)
        expect(elem.isExisting).toBeCalled()
        expect(elem.waitUntil.mock.calls[0][1]).toBe(1000)
        expect(elem.waitUntil.mock.calls[0][2]).toBe('element ("foobar") still not existing after 1000ms')
    })

    test('should use default waitFor duration', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            options: { waitforTimeout: 1234 },
            waitForExist : tmpElem.waitForExist,
            isExisting: jest.fn().mockReturnValueOnce(Promise.resolve(true)),
            elementId : null,
            waitUntil : jest.fn().mockImplementation(
                (condition) => condition.call(elem)),
            isElementDisplayed : jest.fn(() => Promise.resolve())
        }

        await elem.waitForExist()
        expect(elem.isExisting).toBeCalled()
        expect(elem.waitUntil.mock.calls[0][1]).toBe(1234)
    })

    test('should allow to set custom error', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            selector: 'barfoo',
            options: { waitforTimeout: 1234 },
            waitForExist : tmpElem.waitForExist,
            isExisting: jest.fn().mockReturnValueOnce(Promise.resolve(true)),
            elementId : null,
            waitUntil : jest.fn().mockImplementation(
                (condition) => condition.call(elem)),
            isElementDisplayed : jest.fn(() => Promise.resolve())
        }

        await elem.waitForExist(duration, true, 'my custom error')
        expect(elem.isExisting).toBeCalled()
        expect(elem.waitUntil.mock.calls[0][2]).toBe('my custom error')
    })
})
