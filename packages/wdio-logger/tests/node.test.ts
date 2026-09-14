import fs from 'node:fs'
import { it, describe, expect, vi, afterEach, beforeAll, beforeEach, afterAll } from 'vitest'

import nodeLogger from '../src/index.js'
import nodeLogger2 from '../build/index.js'

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

        describe('making patterns', () => {
            afterEach(() => {
                delete process.env.WDIO_LOG_MASKING_PATTERNS
            })

            describe('given a WDIO_LOG_MASKING_PATTERNS value', () => {
                it('masked sensitive information with one pattern', () => {
                    process.env.WDIO_LOG_PATH = 'wdio.test.log'
                    process.env.WDIO_LOG_MASKING_PATTERNS = '--key=[^ ]*'

                    const log = nodeLogger('test-logFile-maskedLogPatternNoFlag')
                    log.info('wdio.conf.ts --user= --key=mySecretKey --spec template.test.ts')

                    expect(write.mock.results[0].value).toContain('wdio.conf.ts --user= **MASKED** --spec template.test.ts')
                })

                it('masked sensitive information and keep ending new line even when capturing the whole line', () => {
                    process.env.WDIO_LOG_PATH = 'wdio.test.log'
                    process.env.WDIO_LOG_MASKING_PATTERNS = '/RESULT ([^ ]*)/'

                    const log = nodeLogger('test-logFile-maskedEverythingButKeepNewLine')
                    log.info('RESULT test')

                    expect(write.mock.results[0].value).toContain('**MASKED**\n')
                })

                it('masked sensitive information with one pattern having 0 group and global flag', () => {
                    process.env.WDIO_LOG_PATH = 'wdio.test.log'
                    process.env.WDIO_LOG_MASKING_PATTERNS = '/--key=[^ ]*/gi'

                    const log = nodeLogger('test-logFile-maskedLogFile0Group')
                    log.info('wdio.conf.ts --user= --KEY=mySecretKey --key=mySecretKey --spec template.test.ts')

                    expect(write.mock.results[0].value).toContain('wdio.conf.ts --user= **MASKED** **MASKED** --spec template.test.ts')
                })

                it('masked sensitive information with one pattern having 1 group', () => {
                    process.env.WDIO_LOG_PATH = 'wdio.test.log'
                    process.env.WDIO_LOG_MASKING_PATTERNS = '--key=([^ ]*)'

                    const log = nodeLogger('test-logFile-maskedLogFile2Group')
                    log.info('wdio.conf.ts --user= --key=mySecretKey --spec template.test.ts')

                    expect(write.mock.results[0].value).toContain('wdio.conf.ts --user= --key=**MASKED** --spec template.test.ts')
                })

                it('masked sensitive information with two patterns having 1 groups each', () => {
                    process.env.WDIO_LOG_PATH = 'wdio.test.log'
                    process.env.WDIO_LOG_MASKING_PATTERNS = '--key=([^ ]*),/TOKEN=([^ ]*)/i'

                    const log = nodeLogger('test-logFile-masked2RegExHaving2Group')
                    log.info('TOKEN=mySecretToken wdio.conf.ts --user=myUser --key=mySecretKey --spec template.test.ts')

                    expect(write.mock.results[0].value).toContain('TOKEN=**MASKED** wdio.conf.ts --user=myUser --key=**MASKED** --spec template.test.ts')
                })

                it('masked sensitive information when logging arrays of string', () => {
                    process.env.WDIO_LOG_PATH = 'wdio.test.log'
                    process.env.WDIO_LOG_MASKING_PATTERNS = 'COMMAND ([^ ]*)'

                    const log = nodeLogger('test-logFile-maskedLoggingOfStringArrays')
                    log.info('COMMAND', 'mySecretKey')

                    expect(write.mock.results[0].value).toContain('COMMAND **MASKED**')
                })

                describe('given call to getLogger.setMaskingPatterns', () => {
                    const pattern = '(--key=)([^ ]*)'
                    const expectedPatterns = [/(--key=)([^ ]*)/]

                    const scenarios: {
                        name: string
                        logger: string
                        config: Record<string, string>
                        expectedPatterns: RegExp[] | undefined
                    }[] = [{
                        name: 'should be possible to set masking pattern in config',
                        logger: 'scenarios-setMaskingPatterns-3',
                        config: { 'scenarios-setMaskingPatterns-3': pattern },
                        expectedPatterns
                    }, {
                        name: 'should be possible to override WDIO_LOG_MASKING_PATTERNS in config',
                        logger: 'scenarios-setMaskingPatterns-5',
                        get config() {
                            process.env.WDIO_LOG_MASKING_PATTERNS = 'info'
                            return { 'scenarios-setMaskingPatterns-5': pattern }
                        },
                        expectedPatterns
                    }, {
                        name: 'should be possible to set multiple patterns in config for one logger',
                        logger: 'scenarios-setMaskingPatterns-6',
                        get config() {
                            return { 'scenarios-setMaskingPatterns-6': `${pattern},info` }
                        },
                        expectedPatterns: [expectedPatterns[0], /info/]
                    }]

                    scenarios.forEach((scenario) => {
                        it(scenario.name, () => {
                            nodeLogger.setMaskingPatterns(scenario.config)

                            const log = nodeLogger(scenario.logger)
                            expect(log.maskingPatterns).toEqual(scenario.expectedPatterns)
                        })
                    })

                    it('should be possible to set patterns in config for multiple loggers', () => {
                        const config = { 'test-logFile-setMaskingPatterns-1': pattern,  'test-logFile-setMaskingPatterns-2': 'info' }

                        nodeLogger.setMaskingPatterns(config)

                        expect(nodeLogger('test-logFile-setMaskingPatterns-1').maskingPatterns).toEqual(expectedPatterns)
                        expect(nodeLogger('test-logFile-setMaskingPatterns-2').maskingPatterns).toEqual([/info/])
                    })

                    it('should be possible to pass a default using `setMaskingPatterns`', () => {
                        nodeLogger.setMaskingPatterns(pattern)

                        expect(nodeLogger('test-logFile-setMaskingPatterns-3').maskingPatterns).toEqual(expectedPatterns)
                    })
                    it('should be possible to pass a default using `WDIO_LOG_MASKING_PATTERNS` env', () => {
                        process.env.WDIO_LOG_MASKING_PATTERNS = 'myEnvPattern'

                        expect(nodeLogger('test-logFile-setMaskingPatterns-4').maskingPatterns).toEqual([/myEnvPattern/])
                    })
                    it('should throw when wrong type', () => {
                        process.env.WDIO_LOG_MASKING_PATTERNS = 'myEnvPattern'

                        expect(() => nodeLogger.setMaskingPatterns(undefined as unknown as string)).throw('Invalid pattern property, expected `string` or `Record<string, string>` but received `undefined`')

                    })
                })
            })
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
            delete process.env.WDIO_LOG_PATH
            logInfoSpy.mockRestore()
            nodeLogger.clearLogger()
            nodeLogger2.clearLogger()
        })
    })

    describe('given logs outputted in the console', () => {

        describe('given WDIO_LOG_MASKING_PATTERNS', () => {
            const consoleInfoSpy = vi.spyOn(console, 'info')
            beforeAll(() => {
                delete process.env.WDIO_LOG_MASKING_PATTERNS
                consoleInfoSpy.mockClear()
            })
            afterEach(() => {
                delete process.env.WDIO_LOG_MASKING_PATTERNS
                consoleInfoSpy.mockClear()
            })

            describe('given WDIO_LOG_MASKING_PATTERNS is undefined', () => {
                it('does not mask sensitive information', () => {
                    const log = nodeLogger('test-console-noMasking')
                    log.info('wdio.conf.ts --key=mySecretKey --spec template.test.ts')

                    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('cyanBright INFO whiteBright test-console-noMasking: wdio.conf.ts --key=mySecretKey --spec template.test.ts'))
                })

                it('logs info with array or arguments for RESULT matching string with cyan color', () => {
                    const log = nodeLogger('test-console-noMasking-MatchingStringWithColor')
                    log.info('RESULT', 'mySecretKey')

                    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('cyanBright INFO whiteBright test-console-noMasking-MatchingStringWithColor:'), 'cyan RESULT', 'mySecretKey')
                })
            })

            describe('given WDIO_LOG_MASKING_PATTERNS is defined', () => {
                it('masked sensitive information with one pattern', () => {
                    process.env.WDIO_LOG_MASKING_PATTERNS = '--key=([^ ]*)'

                    const log = nodeLogger('test-console-masked1Pattern')
                    log.info('wdio.conf.ts --key=mySecretKey --spec template.test.ts')

                    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('wdio.conf.ts --key=**MASKED** --spec template.test.ts'))
                })

                it('masked sensitive information and keep date, formatting but colors does not work and ensure no trailing new line', () => {
                    process.env.WDIO_LOG_MASKING_PATTERNS = '--key=([^ ]*)'

                    const log = nodeLogger('test-console-masked1Pattern')
                    log.info('--key=mySecretKey')

                    expect.stringMatching(
                        /^gray \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z cyanBright INFO whiteBright test-console-masked1Pattern: --key=\*\*MASKED\*\*$/
                    )
                })

                it('logs masked sensitive information without color as an entire string instead of an args array with color', () => {
                    process.env.WDIO_LOG_MASKING_PATTERNS = 'RESULT ([^ ]*)'

                    const log = nodeLogger('test-console-maskedLoggingOfStringArrays')
                    log.info('RESULT', 'mySecretKey')

                    expect(consoleInfoSpy).toHaveBeenCalledWith(expect.stringContaining('cyan RESULT **MASKED**'))
                })
            })
        })
    })

    describe('waitForBuffer with no logFile', () => {
        it('should be ok if logFile is undefined', async () => {
            expect(await nodeLogger.waitForBuffer()).toBe(undefined)
        })
    })
})
