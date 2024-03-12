import logger from '@wdio/logger'
import { BStackLogger } from '../src/bstackLogger'
import fs from 'node:fs'

const log = logger('test')

jest.mock('node:fs', () => ({
    existsSync: jest.fn(),
    truncateSync: jest.fn(),
    mkdirSync: jest.fn()
}))

describe('BStackLogger Log methods', () => {

    it('should write to console - info', () => {
        const logInfoMock = jest.spyOn(log, 'info')

        BStackLogger.info('This is the test for log.info')
        expect(logInfoMock).toBeCalled()
    })

    it('should write to console - warn', () => {
        const logWarnMock = jest.spyOn(log, 'warn')

        BStackLogger.warn('This is the test for log.warn')
        expect(logWarnMock).toBeCalled()
    })

    it('should write to console - trace', () => {
        const logTraceMock = jest.spyOn(log, 'trace')

        BStackLogger.trace('This is the test for log.trace')
        expect(logTraceMock).toBeCalled()
    })

    it('should write to console - debug', () => {
        const logDebugMock = jest.spyOn(log, 'debug')

        BStackLogger.debug('This is the test for log.debug')
        expect(logDebugMock).toBeCalled()
    })

    describe('ensureLogsFolder', () => {
        it('should create logs folder if it does not exist', () => {
            // Arrange
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockReturnValue(null)

            // Act
            BStackLogger.ensureLogsFolder()

            // Assert
            expect(mkdirSyncMock).toHaveBeenCalledWith(BStackLogger.logFolderPath)
            mkdirSyncMock.mockRestore()
        })

        it('should not create logs folder if it already exists', () => {
            // Arrange
            const existsSyncMock = jest.spyOn(fs, 'existsSync').mockReturnValue(true)
            const mkdirSyncMock = jest.spyOn(fs, 'mkdirSync').mockReturnValue(null)

            // Act
            BStackLogger.ensureLogsFolder()

            // Assert
            expect(existsSyncMock).toHaveBeenCalledWith(BStackLogger.logFolderPath)
            expect(mkdirSyncMock).not.toHaveBeenCalled()
            existsSyncMock.mockRestore()
            mkdirSyncMock.mockRestore()
        })
    })

})

