import path from 'path'
import archiver from 'archiver'
import { remote } from '../../../src'

jest.mock('fs')

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
        browser.file = jest.fn().mockReturnValue(Promise.resolve())

        const archiverMock = archiver()
        browser.uploadFile(path.resolve(__dirname, '..', '__fixtures__', 'toUpload.jpg'))
        expect(archiverMock.args).toEqual(['zip'])
        expect(archiverMock.append).toBeCalledWith(undefined, { name: 'toUpload.jpg' })
    })

    it('reject on error', async () => {
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })
        browser.file = jest.fn().mockReturnValue(Promise.resolve())

        let commandError = null
        const archiverMock = archiver()
        const command = browser.uploadFile(path.resolve(__dirname, '..', '__fixtures__', 'toUpload.jpg'))
            .catch((e) => (commandError = e))
        expect(archiverMock.on.mock.calls[0][0]).toBe('error')
        archiverMock.on.mock.calls[0][1](new Error('boom'))

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
        browser.file = jest.fn().mockReturnValue(Promise.resolve())

        const archiverMock = archiver()
        const command = browser.uploadFile(path.resolve(__dirname, '..', '__fixtures__', 'toUpload.jpg'))
        expect(archiverMock.on.mock.calls[1][0]).toBe('data')
        expect(archiverMock.on.mock.calls[2][0]).toBe('end')

        archiverMock.on.mock.calls[1][1](Buffer.alloc(10))
        archiverMock.on.mock.calls[1][1](Buffer.alloc(33))
        archiverMock.on.mock.calls[2][1]()

        await command
        expect(browser.file).toBeCalledWith('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==')
    })

    it('reject if finalize returns error', async () => {
        const browser = await remote({
            baseUrl: 'http://webdriver.io',
            capabilities: {
                browserName: 'chrome'
            }
        })
        browser.file = jest.fn().mockReturnValue(Promise.resolve())

        let commandError = null
        const archiverMock = archiver()
        const command = browser.uploadFile(path.resolve(__dirname, '..', '__fixtures__', 'toUpload.jpg'))
            .catch((e) => (commandError = e))
        archiverMock.finalize.mock.calls[0][0](new Error('boom'))

        await command
        expect(commandError).toEqual(new Error('boom'))
    })

    afterEach(() => {
        const archiverMock = archiver()
        archiverMock.on.mockClear()
        archiverMock.append.mockClear()
        archiverMock.finalize.mockClear()
    })
})
