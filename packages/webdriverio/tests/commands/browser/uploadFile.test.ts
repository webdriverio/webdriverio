import { expect, describe, it, afterEach, vi } from 'vitest'

import path from 'node:path'
import archiver from 'archiver'
import { remote } from '../../../src/index.js'

vi.mock('node:fs', () => ({
    default: {
        createReadStream: vi.fn(),
        existsSync: vi.fn()
    }
}))
vi.mock('got')
vi.mock('archiver')
vi.mock('devtools')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('uploadFile', () => {
    it('should throw if browser does not support it', async function () {
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'firefox'
            }
        })

        await expect(browser.uploadFile('/foo/bar.jpg')).rejects.toEqual(
            new Error('The uploadFile command is not available in mockBrowser'))
    })

    it('should throw if path is not a string', async function () {
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })

        // @ts-expect-error wrong parameter
        await expect(browser.uploadFile(123)).rejects.toEqual(
            new Error('number or type of arguments don\'t agree with uploadFile command'))
    })

    it('should archive the file and use file command', async () => {
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })
        browser.file = vi.fn().mockReturnValue(Promise.resolve())

        const archiverMock = archiver('zip')
        browser.uploadFile(path.resolve(__dirname, '..', '__fixtures__', 'toUpload.jpg'))
        expect((archiverMock as any).args).toEqual(['zip'])
        expect(archiverMock.append).toBeCalledWith(undefined, { name: 'toUpload.jpg' })
    })

    it('reject on error', async () => {
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })
        browser.file = vi.fn().mockReturnValue(Promise.resolve())

        let commandError: Error | null = null
        const archiverMock = archiver('zip')
        const command = browser.uploadFile(path.resolve(__dirname, '..', '__fixtures__', 'toUpload.jpg'))
            .catch((e: Error) => (commandError = e))
        expect(vi.mocked(archiverMock.on).mock.calls[0][0]).toBe('error')
        vi.mocked(archiverMock.on).mock.calls[0][1](new Error('boom'))

        await command
        expect(commandError).toEqual(new Error('boom'))
    })

    it('should push zip data to file command', async () => {
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })
        browser.file = vi.fn().mockReturnValue(Promise.resolve('/some/local/path'))

        const archiverMock = archiver('zip')
        const command = browser.uploadFile(path.resolve(__dirname, '..', '__fixtures__', 'toUpload.jpg'))
        expect(vi.mocked(archiverMock.on).mock.calls[1][0]).toBe('data')
        expect(vi.mocked(archiverMock.on).mock.calls[2][0]).toBe('end')

        vi.mocked(archiverMock.on).mock.calls[1][1](Buffer.alloc(10))
        vi.mocked(archiverMock.on).mock.calls[1][1](Buffer.alloc(33))
        vi.mocked(archiverMock.on).mock.calls[2][1]()

        const localPath = await command
        expect(browser.file).toBeCalledWith('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==')
        expect(localPath).toBe('/some/local/path')
    })

    afterEach(() => {
        const archiverMock = archiver('zip')
        vi.mocked(archiverMock.on).mockClear()
        vi.mocked(archiverMock.append).mockClear()
        vi.mocked(archiverMock.finalize).mockClear()
    })
})
