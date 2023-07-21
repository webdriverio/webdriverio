import fs from 'node:fs'
import { it, describe, expect, vi, afterEach, beforeEach, afterAll } from 'vitest'

import nodeLogger from '../src/node.js'
import nodeLogger2 from '../build/node.js'

import type log from 'loglevel'

vi.useFakeTimers()
vi.mock('chalk')

describe('wdio-logger node', () => {
    describe('log level', () => {
        const log = nodeLogger('test:setLevel')

        it('DEFAULT_LEVEL', () => {
            expect(log.getLevel()).toEqual(2)
        })

        const scenarios: {
            level: log.LogLevelDesc,
            logLevel: log.LogLevelNumbers
        }[] = [{
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
        const scenarios: {
            name: string
            logger: string
            config?: Record<string, log.LogLevelDesc>
            logLevel: number
        }[] = [{
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
                return { 'test-setLogLevelsConfig-5': 'warn' as log.LogLevelDesc }
            },
            logLevel: 3
        }, {
            name: 'should be possible to set logLevel in config for all sub levels',
            logger: 'test-setLogLevelsConfig-6:foo',
            config: { 'test-setLogLevelsConfig-6:bar': 'error' as log.LogLevelDesc },
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
            const log2 = nodeLogger('test-applyLogLevelsConfig1:foobar')
            expect(log1.getLevel()).toEqual(2)
            expect(log2.getLevel()).toEqual(2)

            nodeLogger.setLogLevelsConfig({ 'test-applyLogLevelsConfig1': 'error' })

            expect(log1.getLevel()).toEqual(4)
            expect(log2.getLevel()).toEqual(4)
        })

        it('should not change logLevel if not provided in config', () => {
            const log = nodeLogger('test-applyLogLevelsConfig')
            expect(log.getLevel()).toEqual(2)

            nodeLogger.setLogLevelsConfig(undefined)

            expect(log.getLevel()).toEqual(2)
        })

        it('should set wdio logLevel passed as argument', () => {
            const log = nodeLogger('test-wdio-log-level')
            expect(log.getLevel()).toEqual(2)
            nodeLogger.setLogLevelsConfig(undefined, 'error')
            expect(log.getLevel()).toEqual(4)
        })

        afterEach(() => {
            delete process.env.WDIO_LOG_LEVEL
        })
    })

    describe('logFile', () => {
        const write = vi.fn(logText => logText)
        const logInfoSpy = vi.spyOn(fs, 'createWriteStream')
        const logCacheAddSpy = vi.spyOn(Set.prototype, 'add')
        const logCacheForEachSpy = vi.spyOn(Set.prototype, 'forEach')
        let writableBuffer: any = null
        logInfoSpy.mockImplementation((path: fs.PathLike): fs.WriteStream => ({
            path: path as string,
            write,
            writable: true,
            // @ts-ignore
            get writableBuffer () {
                // @ts-ignore
                return writableBuffer
            },
            // @ts-expect-error
            end: vi.fn()
        }))

        beforeEach(() => {
            logCacheAddSpy.mockClear()
        })

        it('should be possible to add to cache', () => {
            const log = nodeLogger('test-logFile1')
            log.info('foo')
            log.info('bar')

            const logCache = logCacheAddSpy.mock.results[0].value

            expect(logCacheAddSpy).toBeCalledTimes(2)
            expect(logCache.size).toBe(2)

            const logCacheValues = logCache.values()
            expect(logCacheValues.next().value).toContain('test-logFile1: foo')
            expect(logCacheValues.next().value).toContain('test-logFile1: bar')

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
            log.info('foo')
            log.info('bar')

            expect(write.mock.calls.length).toBe(2)
            expect(write.mock.results[0].value).toContain('test-logFile2: foo')
            expect(write.mock.results[1].value).toContain('test-logFile2: bar')
            expect(write.mock.results[1].value).not.toContain('test-logFile2: foo')

            expect(logCacheForEachSpy).toBeCalledTimes(0)
        })

        it('serializers', () => {
            process.env.WDIO_LOG_PATH = 'wdio.test.log'

            const log = nodeLogger('test-logFile4')
            log.info('DATA')
            log.info('RESULT')
            log.info('COMMAND')
            log.info(new Error('bar'))

            expect(write.mock.calls.length).toBe(4)
            expect(write.mock.results[0].value).toContain('test-logFile4: yellow DATA')
            expect(write.mock.results[1].value).toContain('test-logFile4: cyan RESULT')
            expect(write.mock.results[2].value).toContain('test-logFile4: magenta COMMAND')
            expect(write.mock.results[3].value).toContain('test-logFile4: Error: bar')
        })

        it('is not confused by multiple copies of source code', () => {
            process.env.WDIO_LOG_PATH = 'wdio.test.log'

            const log = nodeLogger('test-logFile4')
            const log2 = nodeLogger2('test-logFile4')
            log.info('foo')
            log2.error(new Error('bar'))

            expect(write.mock.calls.length).toBe(2)
            expect(write.mock.results[0].value).toContain('test-logFile4: foo')
            expect(write.mock.results[1].value).toContain('test-logFile4: Error: bar')
        })

        describe('clearLogger', () => {
            it('should be possible to change output directory', () => {
                process.env.WDIO_LOG_PATH = 'wdio.test.log'
                const log = nodeLogger('test-logFile5')
                log.info('foo')
                nodeLogger.clearLogger()

                process.env.WDIO_LOG_PATH = 'wdio.test.log2'
                log.info('bar')
                expect(write.mock.instances[0].path).toContain('wdio.test.log')
                expect(write.mock.instances[1].path).toContain('wdio.test.log2')
            })
        })

        describe('waitForBuffer with logFile', () => {
            const scenarios = [{
                name: 'should be ok buffer is empty',
                writableBuffer: [],
                logPath: 'wdio.test.log'
            }, {
                name: 'should flush if buffer is not defined',
                writableBuffer: undefined,
                logPath: 'wdio.test.log'
            }]

            scenarios.forEach((scenario, idx) => {
                it(scenario.name, async () => {
                    process.env.WDIO_LOG_PATH = scenario.logPath
                    const log = nodeLogger(`test-logFile-buffer-${idx}`)
                    log.info('foo')

                    writableBuffer = scenario.writableBuffer

                    expect(await nodeLogger.waitForBuffer()).toBe(undefined)
                })
            })

            it('should wait for buffer to be empty', async () => {
                process.env.WDIO_LOG_PATH = 'wdio.test.log'
                const log = nodeLogger('test-logFile-buffer-wait')
                log.info('foo')
                writableBuffer = ['bar']

                const waitPromise = nodeLogger.waitForBuffer()
                vi.advanceTimersByTime(30)
                writableBuffer = []
                vi.advanceTimersByTime(30)
                expect(await waitPromise).toBe(undefined)
            })
        })

        beforeEach(() => {
            delete process.env.WDIO_LOG_PATH
            nodeLogger.clearLogger()
            nodeLogger2.clearLogger()
        })
        afterEach(() => {
            logCacheForEachSpy.mockClear()
            logCacheAddSpy.mockClear()
            logInfoSpy.mockClear()
            write.mockClear()
            writableBuffer = undefined
        })
        afterAll(() => {
            logInfoSpy.mockRestore()
        })
    })
    describe('waitForBuffer with no logFile', () => {
        it('should be ok if logFile is undefined', async () => {
            expect(await nodeLogger.waitForBuffer()).toBe(undefined)
        })
    })
})
