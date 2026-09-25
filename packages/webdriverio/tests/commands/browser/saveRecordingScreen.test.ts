import { expect, describe, beforeEach, afterEach, it, vi, type MockInstance } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { remote } from '../../../src/index.js'
import * as utils from '../../../src/node/utils.js'

import '../../../src/node.js'

vi.mock('fs')
vi.mock('fs/promises', () => ({
    default: {
        access: vi.fn().mockResolvedValue({})
    }
}))
vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('saveRecordingScreen', () => {
    let browser: WebdriverIO.Browser
    let pathResolveSpy: MockInstance
    let assertDirectoryExistsSpy: MockInstance
    let writeFileSyncSpy: MockInstance

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar',
                // @ts-ignore mock feature
                mobileMode: true,
                platformName: 'Android',
            } as any
        })

        pathResolveSpy = vi.spyOn(path, 'resolve')
        assertDirectoryExistsSpy = vi.spyOn(utils, 'assertDirectoryExists')
        writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync')
    })

    afterEach(() => {
        pathResolveSpy.mockClear()
        assertDirectoryExistsSpy.mockClear()
        writeFileSyncSpy.mockClear()
    })

    it('should capture video', async () => {
        const executeSpy = vi.spyOn(browser, 'execute').mockResolvedValue('c29tZSBzY3JlZW5zaG90')
        const video = await browser.saveRecordingScreen('./packages/bar.mp4')

        // get path
        expect(pathResolveSpy).toHaveBeenCalledTimes(1)
        expect(pathResolveSpy).toHaveBeenCalledWith('./packages/bar.mp4')

        // assert directory
        expect(assertDirectoryExistsSpy).toHaveBeenCalledTimes(1)
        expect(assertDirectoryExistsSpy).toHaveBeenCalledWith(pathResolveSpy.mock.results[0].value)

        expect(executeSpy).toHaveBeenCalledWith('mobile: stopMediaProjectionRecording')
        expect(video.toString()).toBe('some screenshot')

        // write to file
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1)
        expect(writeFileSyncSpy).toHaveBeenCalledWith(pathResolveSpy.mock.results[0].value, expect.any(Buffer))
    })

    it('should fail if no filename provided', async () => {
        const expectedError = new Error('saveRecordingScreen expects a filepath')

        // no file
        await expect(
            // @ts-ignore test invalid parameter
            browser.saveRecordingScreen()
        ).rejects.toEqual(expectedError)
    })
})
