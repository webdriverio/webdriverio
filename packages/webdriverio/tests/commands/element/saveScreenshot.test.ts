import fs from 'node:fs/promises'
import path from 'node:path'
import type { SpyInstance } from 'vitest'
import { expect, describe, it, vi, beforeEach, afterEach } from 'vitest'

// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'

vi.mocked(fs.access).mockResolvedValue()

import { remote } from '../../../src/index.js'
import * as utils from '../../../src/utils/index.js'

vi.mock('got')
vi.mock('fs/promises')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('saveScreenshot', () => {
    let getAbsoluteFilepathSpy: SpyInstance
    let assertDirectoryExistsSpy: SpyInstance
    const writeFileSyncSpy = vi.spyOn(fs, 'writeFile')

    beforeEach(() => {
        getAbsoluteFilepathSpy = vi.spyOn(utils, 'getAbsoluteFilepath')
        assertDirectoryExistsSpy = vi.spyOn(utils, 'assertDirectoryExists')
        vi.spyOn(fs, 'access').mockResolvedValue()
    })

    afterEach(() => {
        getAbsoluteFilepathSpy.mockClear()
        assertDirectoryExistsSpy.mockClear()
        writeFileSyncSpy.mockClear()
    })

    it('should take screenshot of page', async () => {
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')
        const screenshot = await elem.saveScreenshot('./packages/bar.png')

        // get path
        expect(getAbsoluteFilepathSpy).toHaveBeenCalledTimes(1)
        expect(getAbsoluteFilepathSpy).toHaveBeenCalledWith('./packages/bar.png')

        // assert directory
        expect(assertDirectoryExistsSpy).toHaveBeenCalledTimes(1)
        expect(assertDirectoryExistsSpy).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value)

        // request
        expect(vi.mocked(got).mock.calls[2][1]!.method).toBe('GET')
        expect(vi.mocked(got).mock.calls[2][0]!.pathname)
            .toBe('/session/foobar-123/element/some-elem-123/screenshot')
        expect(screenshot.toString()).toBe('some element screenshot')

        // write to file
        expect(writeFileSyncSpy).toHaveBeenCalledTimes(1)
        expect(writeFileSyncSpy).toHaveBeenCalledWith(getAbsoluteFilepathSpy.mock.results[0].value, expect.any(Buffer))
    })

    it('should fail if no filename provided', async () => {
        const expectedError = new Error('saveScreenshot expects a filepath of type string and ".png" file ending')
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })

        const elem = await browser.$('#elem')

        // @ts-expect-error wrong parameter
        await expect(elem.saveScreenshot()).rejects.toEqual(expectedError)
        // wrong extension
        await expect(elem.saveScreenshot('./file.txt')).rejects.toEqual(expectedError)
    })
})
