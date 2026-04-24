import path from 'node:path'
import fs from 'node:fs'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import logger from '@wdio/logger'
import { BStackLogger } from '../../src/cli/cliLogger.js'

const log = logger('test')

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('node:fs', () => ({
    default: {
        readFileSync: vi.fn().mockReturnValue('1234\nsomepath'),
        existsSync: vi.fn(),
        truncateSync: vi.fn(),
        mkdirSync: vi.fn(),
        createWriteStream: vi.fn().mockReturnValue({ write: vi.fn(), writable: true, end: vi.fn() }),
    }
}))

describe('cliLogger - redactCredentials', () => {
    beforeEach(() => {
        vi.spyOn(fs, 'existsSync').mockReturnValue(true)
    })

    describe('JSON-style key:value redaction', () => {
        it('should redact userName with double quotes', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('config: {"userName": "myUser123"}')
            expect(logInfoMock).toHaveBeenCalledWith('config: {"userName": ""}')
        })

        it('should redact accessKey with double quotes', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('config: {"accessKey": "secretKey456"}')
            expect(logInfoMock).toHaveBeenCalledWith('config: {"accessKey": ""}')
        })

        it('should redact user and key fields', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('config: {"user": "myUser", "key": "myKey"}')
            expect(logInfoMock).toHaveBeenCalledWith('config: {"user": "", "key": ""}')
        })

        it('should redact username with single quotes', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info("config: {'username': 'myUser123'}")
            expect(logInfoMock).toHaveBeenCalledWith("config: {'username': ''}")
        })

        it('should redact multiple credentials in the same message', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('{"username": "user1", "accessKey": "key1"}')
            expect(logInfoMock).toHaveBeenCalledWith('{"username": "", "accessKey": ""}')
        })
    })

    describe('key=value format redaction', () => {
        it('should redact username=value', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('config: username=myUser123, other=value')
            expect(logInfoMock).toHaveBeenCalledWith('config: username=, other=value')
        })

        it('should redact accesskey case-insensitively', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('config: ACCESSKEY=secretKey456, other=value')
            expect(logInfoMock).toHaveBeenCalledWith('config: ACCESSKEY=, other=value')
        })

        it('should redact key: value without quotes', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('username: myUser123, done')
            expect(logInfoMock).toHaveBeenCalledWith('username: , done')
        })
    })

    describe('URL query parameter redaction', () => {
        it('should redact credential at end of URL', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('url: https://hub.example.com?other=val&username=myUser')
            expect(logInfoMock).toHaveBeenCalledWith('url: https://hub.example.com?other=val&username=')
        })
    })

    describe('no false positives', () => {
        it('should not modify messages without credentials', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('No sensitive data here')
            expect(logInfoMock).toHaveBeenCalledWith('No sensitive data here')
        })

        it('should not modify empty messages', () => {
            const logInfoMock = vi.spyOn(log, 'info')
            BStackLogger.info('')
            expect(logInfoMock).toHaveBeenCalledWith('')
        })
    })

    describe('redaction across all log levels', () => {
        const msg = '{"username": "user1", "accessKey": "key1"}'
        const expected = '{"username": "", "accessKey": ""}'

        it('should redact in info', () => {
            const mock = vi.spyOn(log, 'info')
            BStackLogger.info(msg)
            expect(mock).toHaveBeenCalledWith(expected)
        })

        it('should redact in error', () => {
            const mock = vi.spyOn(log, 'error')
            BStackLogger.error(msg)
            expect(mock).toHaveBeenCalledWith(expected)
        })

        it('should redact in debug', () => {
            const mock = vi.spyOn(log, 'debug')
            BStackLogger.debug(msg)
            expect(mock).toHaveBeenCalledWith(expected)
        })

        it('should redact in warn', () => {
            const mock = vi.spyOn(log, 'warn')
            BStackLogger.warn(msg)
            expect(mock).toHaveBeenCalledWith(expected)
        })

        it('should redact in trace', () => {
            const mock = vi.spyOn(log, 'trace')
            BStackLogger.trace(msg)
            expect(mock).toHaveBeenCalledWith(expected)
        })
    })
})
