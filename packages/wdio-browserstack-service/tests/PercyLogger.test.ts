import path from 'node:path'
import fs from 'node:fs'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import logger from '@wdio/logger'
import { PercyLogger } from '../src/Percy/PercyLogger.js'

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
        PercyLogger.logToFile('This is test for method logToFile', 'info')
        expect(existsSyncMock).toHaveBeenCalled()
    })

    it('creates new stream if writeStream is currently null', () => {
        vi.spyOn(fs, 'existsSync').mockReturnValueOnce(false)
        const mkdirSyncMock = vi.spyOn(fs, 'mkdirSync')
        PercyLogger.logToFile('This is test for method logToFile', 'info')
        expect(mkdirSyncMock).toHaveBeenCalled()
    })
})

describe('PercyLogger Log methods', () => {
    let logToFileSpy: any
    beforeEach(() => {
        logToFileSpy = vi.spyOn(PercyLogger, 'logToFile')
    })

    it('should write to file and console - info', () => {
        const logInfoMock = vi.spyOn(log, 'info')

        PercyLogger.info('This is the test for log.info')
        expect(logToFileSpy).toBeCalled()
        expect(logInfoMock).toBeCalled()
    })

    it('should write to file and console - warn', () => {
        const logWarnMock = vi.spyOn(log, 'warn')

        PercyLogger.warn('This is the test for log.warn')
        expect(logToFileSpy).toBeCalled()
        expect(logWarnMock).toBeCalled()
    })

    it('should write to file and console - trace', () => {
        const logTraceMock = vi.spyOn(log, 'trace')

        PercyLogger.trace('This is the test for log.trace')
        expect(logToFileSpy).toBeCalled()
        expect(logTraceMock).toBeCalled()
    })

    it('should write to file and console - debug', () => {
        const logDebugMock = vi.spyOn(log, 'debug')

        PercyLogger.debug('This is the test for log.debug')
        expect(logToFileSpy).toBeCalled()
        expect(logDebugMock).toBeCalled()
    })

    it('should write to file and console - error', () => {
        const logDebugMock = vi.spyOn(log, 'error')

        PercyLogger.error('This is the test for log.error')
        expect(logToFileSpy).toBeCalled()
        expect(logDebugMock).toBeCalled()
    })
})

