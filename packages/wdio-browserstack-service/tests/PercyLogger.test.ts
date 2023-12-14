import logger from '@wdio/logger'
import { PercyLogger } from '../src/Percy/PercyLogger'

const log = logger('test')

// jest.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
jest.mock('node:fs/promises', () => ({
    default: {
        createReadStream: jest.fn().mockReturnValue({ pipe: jest.fn() }),
        createWriteStream: jest.fn().mockReturnValue(
            {
                pipe: jest.fn(),
                write: jest.fn()
            }),
        stat: jest.fn().mockReturnValue(Promise.resolve({ size: 123 })),
    }
}))
jest.mock('node:fs', () => ({
    default: {
        readFileSync: jest.fn().mockReturnValue('1234\nsomepath'),
        existsSync: jest.fn(),
        // existsSync: fs.existsSync,
        truncateSync: jest.fn(),
        mkdirSync: jest.fn()
    }
}))

describe('PercyLogger Log methods', () => {
    let logToFileSpy: any
    beforeEach(() => {
        logToFileSpy = jest.spyOn(PercyLogger, 'logToFile')
    })

    it('should write to file and console - info', () => {
        const logInfoMock = jest.spyOn(log, 'info')

        PercyLogger.info('This is the test for log.info')
        expect(logToFileSpy).toBeCalled()
        expect(logInfoMock).toBeCalled()
    })

    it('should write to file and console - warn', () => {
        const logWarnMock = jest.spyOn(log, 'warn')

        PercyLogger.warn('This is the test for log.warn')
        expect(logToFileSpy).toBeCalled()
        expect(logWarnMock).toBeCalled()
    })

    it('should write to file and console - trace', () => {
        const logTraceMock = jest.spyOn(log, 'trace')

        PercyLogger.trace('This is the test for log.trace')
        expect(logToFileSpy).toBeCalled()
        expect(logTraceMock).toBeCalled()
    })

    it('should write to file and console - debug', () => {
        const logDebugMock = jest.spyOn(log, 'debug')

        PercyLogger.debug('This is the test for log.debug')
        expect(logToFileSpy).toBeCalled()
        expect(logDebugMock).toBeCalled()
    })

    it('should write to file and console - error', () => {
        const logDebugMock = jest.spyOn(log, 'error')

        PercyLogger.error('This is the test for log.error')
        expect(logToFileSpy).toBeCalled()
        expect(logDebugMock).toBeCalled()
    })
})

