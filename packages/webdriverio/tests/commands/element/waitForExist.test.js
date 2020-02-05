import got from 'got'
import { remote } from '../../../src'

describe('waitForExists', () => {
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

    test('should use default waitFor options', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForExist: tmpElem.waitForExist,
            waitUntil: jest.fn(),
            options: { waitforInterval: 5, waitforTimeout: timeout }
        }

        await elem.waitForExist()
        expect(elem.waitUntil.mock.calls).toMatchSnapshot()
    })

    test('should allow to set custom error', async () => {
        const tmpElem = await browser.$('#foo')
        const elem = {
            waitForExist: tmpElem.waitForExist,
            waitUntil: jest.fn(),
            options: { waitforInterval: 5, waitforTimeout: timeout }
        }

        await elem.waitForExist({
            timeout,
            reverse: true,
            timeoutMsg: 'my custom error'
        })
        expect(elem.waitUntil.mock.calls).toMatchSnapshot()
    })
})
