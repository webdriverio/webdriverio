import { expect, describe, beforeEach, afterEach, it, vi, type MockInstance } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'

import { remote } from '../../../src/index.js'
import * as utils from '../../../src/node/utils.js'

import '../../../src/node.js'

vi.mock('fs/promises', () => ({
    default: {
        writeFile: vi.fn().mockResolvedValue({}),
        access: vi.fn().mockResolvedValue({})
    }

}))
vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('saveScreenshot', () => {
    let browser: WebdriverIO.Browser
    let pathResolveSpy: MockInstance
    let assertDirectoryExistsSpy: MockInstance
    let writeFileSpy: MockInstance

    beforeEach(async () => {
        browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                browserName: 'foobar'
            }
        })
        pathResolveSpy = vi.spyOn(path, 'resolve')
        assertDirectoryExistsSpy = vi.spyOn(utils, 'assertDirectoryExists')
        writeFileSpy = vi.spyOn(fs, 'writeFile')
    })

    afterEach(() => {
        pathResolveSpy.mockClear()
        assertDirectoryExistsSpy.mockClear()
        writeFileSpy.mockClear()
    })

    it('should take screenshot of page', async () => {
        const screenshot = await browser.saveScreenshot('./packages/bar.png')

        // get path
        expect(pathResolveSpy).toHaveBeenCalledTimes(1)
        expect(pathResolveSpy).toHaveBeenCalledWith('./packages/bar.png')

        // assert directory
        expect(assertDirectoryExistsSpy).toHaveBeenCalledTimes(1)
        expect(assertDirectoryExistsSpy).toHaveBeenCalledWith(pathResolveSpy.mock.results[0].value)

        // request
        expect(vi.mocked(fetch).mock.calls[1][1]!.method).toBe('GET')
        // @ts-expect-error mock implementation
        expect(vi.mocked(fetch).mock.calls[1][0]!.pathname)
            .toBe('/session/foobar-123/screenshot')
        expect(screenshot.toString()).toBe('some screenshot')

        // write to file
        expect(writeFileSpy).toHaveBeenCalledTimes(1)
        expect(writeFileSpy).toHaveBeenCalledWith(pathResolveSpy.mock.results[0].value, expect.any(Buffer))
    })

    it('should fail if no filename provided', async () => {
        const expectedError =

        // no file
            await expect(
            // @ts-ignore test invalid parameter
                browser.saveScreenshot()
            ).rejects.toEqual(new Error('saveScreenshot expects a filepath of type string and ".png" file ending'))

        // wrong extension
        await expect(
            browser.saveScreenshot('./file.txt')
        ).rejects.toEqual(new Error('Invalid file extension, use ".png" for PNG format'))
    })
})
