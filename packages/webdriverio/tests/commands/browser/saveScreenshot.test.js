import fs from 'fs'

import request from 'request'
import { remote } from '../../../src'
import * as utils from '../../../src/utils'

const writeFileSync = fs.writeFileSync

describe('saveScreenshot', () => {
    let browser, getAbsoluteFilepathSpy, assertDirectoryExistsSpy

    beforeAll(() => {
        fs.writeFileSync = jest.fn()
    })

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        getAbsoluteFilepathSpy = jest.spyOn(utils, 'getAbsoluteFilepath')
        assertDirectoryExistsSpy = jest.spyOn(utils, 'assertDirectoryExists')
    })

    afterEach(() => {
        getAbsoluteFilepathSpy.mockClear()
        assertDirectoryExistsSpy.mockClear()
        fs.writeFileSync.mockClear()
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
        expect(fs.writeFileSync).toHaveBeenCalledTimes(1)
        expect(fs.writeFileSync).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value, expect.any(Buffer))
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

    afterAll(() => {
        fs.writeFileSync = writeFileSync
    })
})
