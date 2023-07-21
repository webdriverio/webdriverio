import type { SpyInstance } from 'vitest'
import { expect, describe, beforeEach, afterEach, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import { remote } from '../../../src/index.js'
import * as utils from '../../../src/utils/index.js'

vi.mock('fs')
vi.mock('got')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('saveScreenshot', () => {
    let browser: WebdriverIO.Browser
    let getAbsoluteFilepathSpy: SpyInstance
    let assertDirectoryExistsSpy: SpyInstance
    let writeFileSyncSpy: SpyInstance

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        getAbsoluteFilepathSpy = vi.spyOn(utils, 'getAbsoluteFilepath')
        assertDirectoryExistsSpy = vi.spyOn(utils, 'assertDirectoryExists')
        writeFileSyncSpy = vi.spyOn(fs, 'writeFileSync')
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
        expect(vi.mocked(got).mock.calls[1][1]!.method).toBe('GET')
        expect(vi.mocked(got).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/screenshot')
        expect(screenshot.toString()).toBe('some screenshot')

        // write to file
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1)
        expect(writeFileSyncSpy).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value, expect.any(Buffer))
    })

    it('should fail if no filename provided', async () => {
        const expectedError = new Error('saveScreenshot expects a filepath of type string and ".png" file ending')

        // no file
        await expect(
            // @ts-ignore test invalid parameter
            browser.saveScreenshot()
        ).rejects.toEqual(expectedError)

        // wrong extension
        await expect(
            browser.saveScreenshot('./file.txt')
        ).rejects.toEqual(expectedError)
    })
})
