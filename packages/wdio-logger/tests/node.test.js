import fs from 'fs'
import nodeLogger from '../src/node'

describe('wdio-logger node', () => {
    describe('log level', () => {
        const log = nodeLogger('test:setLevel')

        it('DEFAULT_LEVEL', () => {
            expect(log.getLevel()).toEqual(0)
        })

        const scenarios = [{
            level: 'trace',
            logLevel: 0
        }, {
            level: 'debug',
            logLevel: 1
        }, {
            level: 'info',
            logLevel: 2
        }, {
            level: 'warn',
            logLevel: 3
        }, {
            level: 'error',
            logLevel: 4
        }, {
            level: 'silent',
            logLevel: 5
        }]

        scenarios.forEach((scenario) => {
            it(`should be possible to set ${scenario.level} logLevel`, () => {
                nodeLogger.setLevel('test:setLevel', scenario.level)
                expect(log.getLevel()).toEqual(scenario.logLevel)
            })
        })
    })

    describe('getLogger', () => {
        const sameLog1 = nodeLogger('test:getLogger')
        const sameLog2 = nodeLogger('test:getLogger')
        const anotherLog = nodeLogger('test:getLogger:test')

        it('should be possible to get same instance of logger', () => {
            expect(sameLog1).toEqual(sameLog2)
        })
        it('should be possible to create new instance', () => {
            expect(sameLog1).not.toEqual(anotherLog)
        })
    })

    describe('setLogLevelsConfig', () => {
        const scenarios = [{
            name: 'should be possible to set logLevel in config',
            logger: 'test-setLogLevelsConfig-3',
            config: { 'test-setLogLevelsConfig-3': 'silent' },
            logLevel: 5
        }, {
            name: 'should be possible to set logLevel in WDIO_LOG_LEVEL',
            logger: 'test-setLogLevelsConfig-4',
            get config() {
                process.env.WDIO_LOG_LEVEL = 'info'
                return undefined
            },
            logLevel: 2
        }, {
            name: 'should be possible to override WDIO_LOG_LEVEL in config',
            logger: 'test-setLogLevelsConfig-5',
            get config() {
                process.env.WDIO_LOG_LEVEL = 'info'
                return { 'test-setLogLevelsConfig-5': 'warn' }
            },
            logLevel: 3
        }, {
            name: 'should be possible to set logLevel in config for all sub levels',
            logger: 'test-setLogLevelsConfig-6:foo',
            config: { 'test-setLogLevelsConfig-6:bar': 'error' },
            logLevel: 4
        }]

        scenarios.forEach((scenario) => {
            it(scenario.name, () => {
                nodeLogger.setLogLevelsConfig(scenario.config)
                const log = nodeLogger(scenario.logger)
                expect(log.getLevel()).toEqual(scenario.logLevel)
            })
        })

        it('should apply logLevels after loggers are created', () => {
            const log1 = nodeLogger('test-applyLogLevelsConfig1')
            const log2 = nodeLogger('test-applyLogLevelsConfig2')
            expect(log1.getLevel()).toEqual(0)
            expect(log2.getLevel()).toEqual(0)

            nodeLogger.setLogLevelsConfig({
                'test-applyLogLevelsConfig1': 'error',
                'test-applyLogLevelsConfig2': 'debug'
            })

            expect(log1.getLevel()).toEqual(4)
            expect(log2.getLevel()).toEqual(1)
        })

        it('should not change logLevel if not provided in config', () => {
            const log = nodeLogger('test-applyLogLevelsConfig')
            expect(log.getLevel()).toEqual(0)

            nodeLogger.setLogLevelsConfig(undefined)

            expect(log.getLevel()).toEqual(0)
        })

        afterEach(() => {
            delete process.env.WDIO_LOG_LEVEL
        })
    })

    describe('logFile', () => {
        const write = jest.fn(logText => logText)
        const logInfoSpy = jest.spyOn(fs, 'createWriteStream')
        const logCacheAddSpy = jest.spyOn(Set.prototype, 'add')
        const logCacheForEachSpy = jest.spyOn(Set.prototype, 'forEach')
        logInfoSpy.mockImplementation((path) => ({
            path,
            write
        }))

        it('should be possible to add to cache', () => {
            const log = nodeLogger('test-logFile1')
            log.info('', 'DATA')
            log.info('', 'RESULT')

            const logCache = logCacheAddSpy.mock.results[0].value

            expect(logCacheAddSpy).toBeCalledTimes(2)
            expect(logCache.size).toBe(2)

            const it = logCache.values()
            expect(it.next().value).toContain('test-logFile1:  yellow DATA')
            expect(it.next().value).toContain('test-logFile1:  cyan RESULT')

            // after
            logCache.clear()
        })

        it('should be possible to create and write to logFile, with cache', () => {
            const log = nodeLogger('test-logFile3')
            log.info('foo')
            const logCache = logCacheAddSpy.mock.results[0].value

            process.env.WDIO_LOG_PATH = 'wdio.test.log'

            log.info('bar')

            expect(logInfoSpy).toBeCalledTimes(1)
            expect(logCache.size).toBe(0)
            expect(logCacheForEachSpy).toBeCalledTimes(1)
        })

        it('should be possible to create and write to logFile, no cache', () => {
            process.env.WDIO_LOG_PATH = 'wdio.test.log'

            const log = nodeLogger('test-logFile2')
            log.info('', 'COMMAND')
            log.info(new Error('bar'))

            expect(write.mock.calls.length).toBe(2)
            expect(write.mock.results[0].value).toContain('test-logFile2:  magenta COMMAND')
            expect(write.mock.results[1].value).toContain('test-logFile2: Error: bar')
            expect(write.mock.results[1].value).not.toContain('test-logFile2:  magenta COMMAND')

            expect(logCacheForEachSpy).toBeCalledTimes(0)
        })

        beforeEach(() => {
            delete process.env.WDIO_LOG_PATH
        })
        afterEach(() => {
            logCacheForEachSpy.mockClear()
            logCacheAddSpy.mockClear()
            logInfoSpy.mockClear()
            write.mockClear()
        })
        afterAll(() => {
            logInfoSpy.mockRestore()
        })
    })
})
