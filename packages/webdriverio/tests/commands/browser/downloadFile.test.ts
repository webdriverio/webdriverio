import { expect, describe, it, afterEach, vi } from 'vitest'

import fs from 'node:fs'
import path from 'node:path'
import JSZip from 'jszip'
import { remote } from '../../../src/index.js'
import logger from '@wdio/logger'

import '../../../src/node.js'

vi.mock('node:fs', () => ({
    default: {
        mkdirSync: vi.fn(),
        readFileSync: vi.fn(),
        writeFileSync: vi.fn()
    }
}))
vi.mock('got')
vi.mock('JSZip', () => ({
    default: {
        loadAsync: vi.fn()
    }
}))
vi.mock('devtools')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('downloadFile', () => {
    it('should throw if browser does not support it', async function () {
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'safari'
            }
        })

        await expect(browser.downloadFile('bar.jpg', '/foo/bar')).rejects.toEqual(
            new Error('The downloadFile command is not available in mockBrowser and only available when using Selenium Grid'))
    })

    it('should throw if path is not a string', async function () {
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })

        // @ts-expect-error wrong parameter
        await expect(browser.downloadFile(123, 456)).rejects.toEqual(
            new Error('number or type of arguments don\'t agree with downloadFile command'))
    })

    it('should unzip the file and use downloadFile command', async () => {
        vi.spyOn(JSZip, 'loadAsync').mockReturnValue(Promise.resolve(
            {
                files: {
                    'file_1': {
                        async: vi.fn()
                    }
                }
            })
        )

        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })
        browser.download = vi.fn().mockReturnValue({
            fileName: 'test',
            contents: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
        })

        await browser.downloadFile('toDownload.jpg', __dirname)
        const log = logger('test')

        expect(log.info).toHaveBeenCalledWith(
            expect.stringContaining('File extracted: file_1')
        )
        expect(fs.writeFileSync).toHaveBeenCalledTimes(2)
    })

    it('reject on error', async () => {
        vi.spyOn(JSZip, 'loadAsync').mockRejectedValue('test'
        )
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })
        browser.download = vi.fn().mockReturnValue({
            fileName: 'test',
            contents: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='
        })

        await browser.downloadFile('toDownload.jpg', __dirname)
        const log = logger('test')

        expect(log.error).toHaveBeenCalledWith('Error unzipping file:', 'test')
    })

    afterEach(() => {
        const log = logger('test')
        vi.mocked(log.info).mockClear()
        vi.mocked(log.error).mockClear()
        vi.mocked(fs.mkdirSync).mockClear()
        vi.mocked(fs.readFileSync).mockClear()
        vi.mocked(fs.writeFileSync).mockClear()
    })
})
