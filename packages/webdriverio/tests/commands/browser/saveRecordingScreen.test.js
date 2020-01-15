import fs from 'fs'
import got from 'got'
import { remote } from '../../../src'
import * as utils from '../../../src/utils'

jest.mock('fs')

describe('saveRecordingScreen', () => {
    let browser, getAbsoluteFilepathSpy, assertDirectoryExistsSpy, writeFileSyncSpy

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                mobileMode: true,
                'appium-version': '1.11.1'
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

    it('should capture video', async () => {
        const video = await browser.saveRecordingScreen('./packages/bar.mp4')

        // get path
        expect(getAbsoluteFilepathSpy).toHaveBeenCalledTimes(1)
        expect(getAbsoluteFilepathSpy).toHaveBeenCalledWith('./packages/bar.mp4')

        // assert directory
        expect(assertDirectoryExistsSpy).toHaveBeenCalledTimes(1)
        expect(assertDirectoryExistsSpy).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value)

        // request
        expect(got.mock.calls[1][1].method).toBe('POST')
        expect(got.mock.calls[1][1].uri.pathname)
            .toBe('/session/foobar-123/appium/stop_recording_screen')
        expect(video.toString()).toBe('some screenshot')

        // write to file
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1)
        expect(writeFileSyncSpy).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value, expect.any(Buffer))
    })

    it('should fail if no filename provided', async () => {
        const expectedError = new Error('saveRecordingScreen expects a filepath')

        // no file
        await expect(
            browser.saveRecordingScreen()
        ).rejects.toEqual(expectedError)
    })
})
