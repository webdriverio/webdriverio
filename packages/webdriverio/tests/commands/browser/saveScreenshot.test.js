
import request from 'request'

describe('saveScreenshot', () => {
    jest.mock('fs')
    const fs = require('fs').default
    const { remote } = require('../../../src')
    const utils = require('../../../src/utils')
    let browser, getAbsoluteFilepathSpy, assertDirectoryExistsSpy, writeFileSyncSpy

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        getAbsoluteFilepathSpy = jest.spyOn(utils, 'getAbsoluteFilepath')
        assertDirectoryExistsSpy = jest.spyOn(utils, 'assertDirectoryExists')
        writeFileSyncSpy = jest.spyOn(fs, 'writeFileSync')
    })

    afterEach(() => {
        getAbsoluteFilepathSpy.mockClear()
        assertDirectoryExistsSpy.mockClear()
        writeFileSyncSpy.mockClear()
    })

    it('should take screenshot of page', async () => {
        const screenshot = await browser.saveScreenshot('./packages/bar.png')

        // get path
        expect(getAbsoluteFilepathSpy).toHaveBeenCalledTimes(1)
        expect(getAbsoluteFilepathSpy).toHaveBeenCalledWith('./packages/bar.png')

        // assert directory
        expect(assertDirectoryExistsSpy).toHaveBeenCalledTimes(1)
        expect(assertDirectoryExistsSpy).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value)

        // request
        expect(request.mock.calls[1][0].method).toBe('GET')
        expect(request.mock.calls[1][0].uri.pathname).toBe('/wd/hub/session/foobar-123/screenshot')
        expect(screenshot.toString()).toBe('some screenshot')

        // write to file
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1)
        expect(writeFileSyncSpy).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value, expect.any(Buffer))
    })

    it('should fail if no filename provided', async () => {
        const expectedError = new Error('saveScreenshot expects a filepath of type string and ".png" file ending')

        // no file
        await expect(
            browser.saveScreenshot()
        ).rejects.toEqual(expectedError)

        // wrong extension
        await expect(
            browser.saveScreenshot('./file.txt')
        ).rejects.toEqual(expectedError)
    })
})
