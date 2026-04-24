import path from 'node:path'
import fs from 'node:fs'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import logger from '@wdio/logger'
import { BStackLogger } from '../src/bstackLogger.js'

const log = logger('test')

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('node:fs/promises', () => ({
    default: {
        createReadStream: vi.fn().mockReturnValue({ pipe: vi.fn() }),
        createWriteStream: vi.fn().mockReturnValue(
            {
                pipe: vi.fn(),
                write: vi.fn()
            }),
        stat: vi.fn().mockReturnValue(Promise.resolve({ size: 123 })),
    }
}))
vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn().mockReturnValue('1234\nsomepath'),
        existsSync: vi.fn(),
        truncateSync: vi.fn(),
        mkdirSync: vi.fn()
    }
}))

describe('logToFile', () => {
    it('creates new stream if writeStream directly if stream is not defined and directory exists', () => {
        const existsSyncMock = vi.spyOn(fs, 'existsSync').mockReturnValueOnce(true)
        BStackLogger.logToFile('This is test for method logToFile', 'info')
        expect(existsSyncMock).toHaveBeenCalled()
    })

    it('creates new stream if writeStream is currently null', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
        const mkdirSyncMock = vi.spyOn(fs, 'mkdirSync')
        BStackLogger.logToFile('This is test for method logToFile', 'info')
        expect(mkdirSyncMock).toHaveBeenCalled()
    })
})

describe('BStackLogger Log methods', () => {
    let logToFileSpy: any
    beforeEach(() => {
        logToFileSpy = vi.spyOn(BStackLogger, 'logToFile')
    })

    it('should write to file and console - info', () => {
        const logInfoMock = vi.spyOn(log, 'info')

        BStackLogger.info('This is the test for log.info')
        expect(logToFileSpy).toBeCalled()
        expect(logInfoMock).toBeCalled()
    })

    it('should write to file and console - warn', () => {
        const logWarnMock = vi.spyOn(log, 'warn')

        BStackLogger.warn('This is the test for log.warn')
        expect(logToFileSpy).toBeCalled()
        expect(logWarnMock).toBeCalled()
    })

    it('should write to file and console - trace', () => {
        const logTraceMock = vi.spyOn(log, 'trace')

        BStackLogger.trace('This is the test for log.trace')
        expect(logToFileSpy).toBeCalled()
        expect(logTraceMock).toBeCalled()
    })

    it('should write to file and console - debug', () => {
        const logDebugMock = vi.spyOn(log, 'debug')

        BStackLogger.debug('This is the test for log.debug')
        expect(logToFileSpy).toBeCalled()
        expect(logDebugMock).toBeCalled()
    })
})

describe('redactCredentials', () => {
    it('should redact userName in JSON-style key:value', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info('config: {"userName": "myUser123"}')
        expect(logInfoMock).toHaveBeenCalledWith('config: {"userName": ""}')
    })

    it('should redact accessKey in JSON-style key:value', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info('config: {"accessKey": "secretKey456"}')
        expect(logInfoMock).toHaveBeenCalledWith('config: {"accessKey": ""}')
    })

    it('should redact username in key=value format', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info('config: username=myUser123, other=value')
        expect(logInfoMock).toHaveBeenCalledWith('config: username=, other=value')
    })

    it('should redact accesskey in key=value format (case insensitive)', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info('config: accesskey=secretKey456, other=value')
        expect(logInfoMock).toHaveBeenCalledWith('config: accesskey=, other=value')
    })

    it('should redact credentials in URL query parameters', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info('url: https://hub.browserstack.com?other=val&username=myUser')
        expect(logInfoMock).toHaveBeenCalledWith('url: https://hub.browserstack.com?other=val&username=')
    })

    it('should redact user and key fields', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info('config: {"user": "myUser123", "key": "myKey456"}')
        expect(logInfoMock).toHaveBeenCalledWith('config: {"user": "", "key": ""}')
    })

    it('should redact multiple credentials in the same message', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info('{"userName": "user1", "accessKey": "key1"}')
        expect(logInfoMock).toHaveBeenCalledWith('{"userName": "", "accessKey": ""}')
    })

    it('should not modify messages without credentials', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info('No sensitive data here')
        expect(logInfoMock).toHaveBeenCalledWith('No sensitive data here')
    })

    it('should redact credentials through all log levels', () => {
        const msg = '{"userName": "user1", "accessKey": "key1"}'
        const expected = '{"userName": "", "accessKey": ""}'

        const infoMock = vi.spyOn(log, 'info')
        BStackLogger.info(msg)
        expect(infoMock).toHaveBeenCalledWith(expected)

        const errorMock = vi.spyOn(log, 'error')
        BStackLogger.error(msg)
        expect(errorMock).toHaveBeenCalledWith(expected)

        const debugMock = vi.spyOn(log, 'debug')
        BStackLogger.debug(msg)
        expect(debugMock).toHaveBeenCalledWith(expected)

        const warnMock = vi.spyOn(log, 'warn')
        BStackLogger.warn(msg)
        expect(warnMock).toHaveBeenCalledWith(expected)

        const traceMock = vi.spyOn(log, 'trace')
        BStackLogger.trace(msg)
        expect(traceMock).toHaveBeenCalledWith(expected)
    })

    it('should redact credentials with single quotes', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info("config: {'userName': 'myUser123'}")
        expect(logInfoMock).toHaveBeenCalledWith("config: {'userName': ''}")
    })

    it('should redact credentials without quotes around key', () => {
        const logInfoMock = vi.spyOn(log, 'info')
        BStackLogger.info('config: userName: myUser123, done')
        expect(logInfoMock).toHaveBeenCalledWith('config: userName: , done')
    })
})

