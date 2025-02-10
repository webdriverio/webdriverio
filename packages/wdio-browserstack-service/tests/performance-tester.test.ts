import fsPromises from 'node:fs/promises'
import fs from 'node:fs'
import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { performance } from 'node:perf_hooks'
import * as bstackLogger from '../src/bstackLogger.js'

import PerformanceTester from '../src/instrumentation/performance/performance-tester.js'
import { PERF_MEASUREMENT_ENV } from '../src/constants.js'

vi.mock('node:fs/promises', () => ({
    default: {
        createReadStream: vi.fn().mockReturnValue({ pipe: vi.fn() }),
        createWriteStream: vi.fn().mockReturnValue(
            {
                pipe: vi.fn(),
                write: vi.fn()
            }),
        stat: vi.fn().mockReturnValue(Promise.resolve({ size: 123 })),
        writeFile: vi.fn().mockReturnValue(Promise.resolve())
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

vi.mock('csv-writer', () => ({
    createObjectCsvWriter: vi.fn(() => ({
        writeRecords: vi.fn().mockResolvedValue(null),
    })),
}))

const bstackLoggerSpy = vi.spyOn(bstackLogger.BStackLogger, 'logToFile')
bstackLoggerSpy.mockImplementation(() => {})

class TestClass {
    @PerformanceTester.Measure('TestMethod') // Applying the Measure decorator to this method
    method() {
        return 'method result' // A simple method to test
    }
}

describe('PerformanceTester', function () {
    afterEach(() => {
        PerformanceTester['_events'] = []
        PerformanceTester.started = false
    })

    describe('startMonitoring', function () {
        beforeEach(() => {
            process.env[PERF_MEASUREMENT_ENV] = 'true'
        })

        it('should start monitoring', () => {
            expect(PerformanceTester.started).toBe(false)
            PerformanceTester.startMonitoring('temp.csv')
            expect(PerformanceTester.started).toBe(true)
            expect(fs.mkdirSync).toBeCalledTimes(2)
        })

        it('should push to events for sync functions', async () => {
            const func = (a: number, b: number) => {
                return a + b
            }
            const timerifyFunc = performance.timerify(func)
            timerifyFunc(1, 2)
            await new Promise(resolve => setTimeout(resolve, 100))
            expect(PerformanceTester['_events']).toEqual([expect.objectContaining({ name: 'func', entryType: 'function', duration: expect.any(Number) })])
        })
    })

    describe('calculateTimes', function () {
        it('should calculate execution times correctly', () => {
            const entries = [
                { name: 'function1', duration: 100 },
                { name: 'function2', duration: 200 },
                { name: 'function1', duration: 50 },
            ]
            PerformanceTester['_events'] = (entries as any)

            const methods = ['function1', 'function2']
            const totalTime = PerformanceTester.calculateTimes(methods)
            expect(totalTime).toEqual(350)
        })
    })

    describe('stopAndGenerate', function () {
        vi.spyOn(fsPromises, 'writeFile').mockImplementation(() => Promise.resolve())

        it('should return if not started', async function () {
            await PerformanceTester.stopAndGenerate('sdf')
            expect(fsPromises.writeFile).toBeCalledTimes(0)
        })

        it('should stop and write generate HTML', async () => {
            process.env[PERF_MEASUREMENT_ENV] = 'true'
            PerformanceTester.startMonitoring('temp.csv')
            await PerformanceTester.stopAndGenerate('temp.html')
            expect(PerformanceTester.started).toBe(false)
            expect(fsPromises.writeFile).toBeCalledTimes(1)
            expect(fsPromises.writeFile).toBeCalledWith(expect.stringContaining('temp.html'), expect.anything())
        })

        it('should stop and write generate CSV', async () => {
            PerformanceTester.startMonitoring('temp.csv')
            await PerformanceTester.stopAndGenerate('temp.html')
            expect(PerformanceTester.started).toBe(false)
            expect(PerformanceTester._csvWriter.writeRecords).toBeCalledTimes(1)
        })
    })

    describe('Measure Decorator', () => {
        beforeEach(() => {
            vi.spyOn(PerformanceTester, 'measure')
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('should call PerformanceTester.measure with correct arguments', () => {
            // Arrange
            const testInstance = new TestClass()
            const expectedLabel = 'TestMethod'

            // Act
            const result = testInstance.method()

            // Assert
            expect(PerformanceTester.measure).toHaveBeenCalledTimes(1)
            expect(PerformanceTester.measure).toHaveBeenCalledWith(
                expectedLabel,
                expect.any(Function),  // The original method
                expect.objectContaining({ methodName: 'method' }),
                expect.anything(),     // Arguments
                expect.anything()      // Context (this)
            )
            expect(result).toBe('method result')
        })

        it('should retain the original method\'s functionality', () => {
            // Arrange
            const testInstance = new TestClass()

            // Act
            const result = testInstance.method()

            // Assert
            expect(result).toBe('method result')
        })
    })

    describe('measureWrapper', () => {
        beforeEach(() => {
            vi.spyOn(PerformanceTester, 'getProcessId').mockReturnValue('mockedProcessId')
            PerformanceTester.browser = { sessionId: 'mockedSessionId' } as WebdriverIO.Browser
            PerformanceTester.scenarioThatRan = ['mockedScenario']
            vi.spyOn(PerformanceTester, 'measure')
        })

        afterEach(() => {
            vi.restoreAllMocks()
        })

        it('should call measure with correct arguments', () => {
            const mockFunction = vi.fn()
            const wrapper = PerformanceTester.measureWrapper('TestName', mockFunction, { command: 'testDetail' })

            wrapper('arg1', 'arg2')

            expect(PerformanceTester.measure).toHaveBeenCalledWith(
                'TestName', // name
                mockFunction, // fn
                {
                    worker: 'mockedProcessId',
                    testName: 'mockedScenario',
                    platform: 'mockedSessionId',
                    command: 'testDetail',
                }, // details
                expect.any(Array) // args
            )
        })

        it('should call the original function with correct arguments', () => {
            const mockFunction = vi.fn().mockReturnValue('result')
            const wrapper = PerformanceTester.measureWrapper('TestName', mockFunction)

            const result = wrapper('arg1', 'arg2')

            expect(mockFunction).toHaveBeenCalledWith('arg1', 'arg2')
            expect(result).toBe('result')
        })

        it('should handle empty details object', () => {
            const mockFunction = vi.fn()
            const wrapper = PerformanceTester.measureWrapper('TestName', mockFunction)

            wrapper()

            expect(PerformanceTester.measure).toHaveBeenCalledWith(
                'TestName',
                mockFunction,
                {
                    worker: 'mockedProcessId',
                    testName: 'mockedScenario',
                    platform: 'mockedSessionId',
                },
                expect.any(Array)
            )
        })
    })
})
