import fs from 'fs'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src'
import * as utils from '../../../src/utils'

jest.mock('fs')

describe('savePDF', () => {
    let browser: WebdriverIO.BrowserObject
    let getAbsoluteFilepathSpy: jest.SpyInstance
    let assertDirectoryExistsSpy: jest.SpyInstance
    let writeFileSyncSpy: jest.SpyInstance

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

    it('should take screenshot of page as a PDF', async () => {
        let screenshot = await browser.savePDF('./packages/bar.pdf')

        // get path
        expect(getAbsoluteFilepathSpy).toHaveBeenCalledTimes(1)
        expect(getAbsoluteFilepathSpy).toHaveBeenCalledWith('./packages/bar.pdf')

        // assert directory
        expect(assertDirectoryExistsSpy).toHaveBeenCalledTimes(1)
        expect(assertDirectoryExistsSpy).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value)

        // request
        expect(got.mock.calls[1][1].method).toBe('POST')
        expect(got.mock.calls[1][0].pathname)
            .toBe('/session/foobar-123/print')
        expect(screenshot.toString()).toBe('some pdf print')

        // write to file
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1)
        expect(writeFileSyncSpy).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value, expect.any(Buffer))

        screenshot = await browser.savePDF('./packages/bar.pdf', {
            orientation: 'landscape',
            background: true,
            width: 24.5,
            height: 26.9,
            top: 10,
            bottom: 10,
            left: 5,
            right: 5,
            shrinkToFit: true
        })
        expect(screenshot.toString()).toBe('some pdf print')
    })

    it('should fail if no filename provided', async () => {
        const expectedError = new Error('savePDF expects a filepath of type string and ".pdf" file ending')

        // no file
        await expect(
            // @ts-ignore test invalid parameter
            browser.savePDF()
        ).rejects.toEqual(expectedError)

        // wrong extension
        await expect(
            browser.savePDF('./file.txt')
        ).rejects.toEqual(expectedError)
    })
})
