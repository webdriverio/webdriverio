import fs from 'fs'
import got from 'got'
import { remote } from '../../../src'
import * as utils from '../../../src/utils'

jest.mock('fs')

describe('savePDF', () => {
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

    it('should take screenshot of page as a PDF', async () => {
        const screenshot = await browser.savePDF('./packages/bar.pdf')

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
    })

    it('should fail if no filename provided', async () => {
        const expectedError = new Error('savePDF expects a filepath of type string and ".pdf" file ending')

        // no file
        await expect(
            browser.savePDF()
        ).rejects.toEqual(expectedError)

        // wrong extension
        await expect(
            browser.savePDF('./file.txt')
        ).rejects.toEqual(expectedError)
    })
})