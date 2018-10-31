import request from 'request'
import { remote } from '../../../src'

describe('saveScreenshot', () => {
    jest.mock('fs')

    it('should take screenshot of page', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        const screenshot = await elem.saveScreenshot('./packages/bar.png')

        expect(request.mock.calls[2][0].method).toBe('GET')
        expect(request.mock.calls[2][0].uri.pathname).toBe('/wd/hub/session/foobar-123/element/some-elem-123/screenshot')
        expect(screenshot.toString()).toBe('some element screenshot')
    })

    it('should fail if no filename provided', async () => {
        const expectedError = new Error('saveScreenshot expects a filepath from type string and ".png" file ending')
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        await expect(
            elem.saveScreenshot()
        ).rejects.toEqual(expectedError)
        await expect(
            elem.saveScreenshot('./file.txt')
        ).rejects.toEqual(expectedError)
    })

    it('should fail if not existing directory', async () => {
        const fs = require('fs')
        fs.existsSync = () => false

        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        await expect(
            elem.saveScreenshot('/i/dont/exist.png')
        ).rejects.toEqual(new Error(`directory (/i/dont) doesn't exist`))
    })
})
