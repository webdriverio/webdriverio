import request from 'request'
import { remote } from '../../../src'
import path from 'path'

describe('saveScreenshot', () => {
    jest.mock('fs')
    const fs = require('fs').default

    let browser
    let spy

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        spy = jest.spyOn(fs, 'writeFileSync')
        fs.existsSync.mockReturnValue(true)
    })

    afterEach(() => {
        if(spy) {
            spy.mockClear()
        }
    })

    it('should take screenshot of page', async () => {
        const screenshot = await browser.saveScreenshot('./packages/bar.png')
        expect(request.mock.calls[1][0].method).toBe('GET')
        expect(request.mock.calls[1][0].uri.pathname).toBe('/wd/hub/session/foobar-123/screenshot')
        expect(screenshot.toString()).toBe('some screenshot')
    })

    it('should fail if no filename provided', async () => {
        const expectedError = new Error('saveScreenshot expects a filepath of type string and ".png" file ending')

        await expect(
            browser.saveScreenshot()
        ).rejects.toEqual(expectedError)
        await expect(
            browser.saveScreenshot('./file.txt')
        ).rejects.toEqual(expectedError)
    })

    it('should fail if not existing directory', async () => {
        fs.existsSync.mockReturnValue(false)

        await expect(
            browser.saveScreenshot('/i/dont/exist.png')
        ).rejects.toEqual(new Error('directory (/i/dont) doesn\'t exist'))
    })

    it('should not change filepath if starts with forward slash', async () => {
        await browser.saveScreenshot('/packages/bar.png')

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith('/packages/bar.png', expect.any(Buffer))
    })

    it('should not change filepath if starts with backslash slash', async () => {
        await browser.saveScreenshot('\\packages\\bar.png')

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith('\\packages\\bar.png', expect.any(Buffer))
    })

    it('should change filepath if does not start with forward or back slash', async () => {
        await browser.saveScreenshot('packages/bar.png')

        expect(spy).toHaveBeenCalledTimes(1)
        expect(spy).toHaveBeenCalledWith(path.join(process.cwd(), 'packages/bar.png'), expect.any(Buffer))
    })
})
