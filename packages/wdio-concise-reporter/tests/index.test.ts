import path from 'node:path'
import { describe, expect, it, beforeAll, beforeEach, vi } from 'vitest'
import ConciseReporter from '../src'
import {
    RUNNER,
    SUITE_UIDS,
    SUITES,
    SUITES_NO_TESTS,
    REPORT,
} from './fixtures'
const reporter = new ConciseReporter({})

vi.mock('chalk')
vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('ConciseReporter', () => {
    let tmpReporter: ConciseReporter

    beforeEach(() => {
        tmpReporter = new ConciseReporter({})
    })

    describe('on create', () => {
        it('should verify initial properties', () => {
            expect(Array.isArray(reporter['_suiteUids'])).toBe(true)
            expect(reporter['_suiteUids'].length).toBe(0)
            expect(Array.isArray(reporter['_suites'])).toBe(true)
            expect(reporter['_suites'].length).toBe(0)
            expect(reporter['_stateCounts']).toEqual({
                failed : 0
            })
        })
    })

    describe('onSuiteStart', () => {
        beforeAll(() => {
            reporter.onSuiteStart(SUITES[0] as any)
        })

        it('should add to suiteUids', () => {
            expect(reporter['_suiteUids'].length).toBe(1)
            expect(reporter['_suiteUids'][0]).toBe('Foo test1')
        })
    })

    describe('onTestFail', () => {
        beforeAll(() => {
            reporter.onTestFail()
        })

        it('should increase stateCounts.failed by 1', () => {
            expect(reporter['_stateCounts'].failed).toBe(1)
        })
    })

    describe('onSuiteEnd', () => {
        beforeAll(() => {
            reporter.onSuiteEnd(SUITES[0] as any)
        })

        it('should add the suite to the suites array', () => {
            expect(reporter['_suites'].length).toBe(1)
            expect(reporter['_suites'][0]).toBe(SUITES[0])
        })
    })

    describe('onRunnerEnd', () => {
        it('should call printReport method', () => {
            reporter.printReport = vi.fn()
            reporter.onRunnerEnd(RUNNER as any)
            expect(vi.mocked(reporter.printReport).mock.calls.length).toBe(1)
            expect(vi.mocked(reporter.printReport).mock.calls[0][0]).toEqual(RUNNER)
        })
    })

    describe('printReport', () => {
        let printReporter: ConciseReporter

        beforeEach(() => {
            printReporter = new ConciseReporter({})
            printReporter.write = vi.fn()
        })

        it('should print the report to the console', () => {
            printReporter['_suiteUids'] = SUITE_UIDS
            printReporter['_suites'] = SUITES as any
            printReporter['_stateCounts'] = {
                failed : 1
            }

            printReporter.printReport(RUNNER as any)

            expect(printReporter.write).toBeCalledWith(REPORT)
        })

        it('should print default report because there are no failed tests', () => {
            printReporter['_suiteUids'] = SUITE_UIDS
            printReporter['_suites'] = SUITES_NO_TESTS as any

            printReporter.printReport(RUNNER as any)

            expect(vi.mocked(printReporter.write).mock.calls.length).toBe(1)
        })
    })

    describe('getCountDisplay', () => {
        it('should return failing count', () => {
            tmpReporter['_stateCounts'].failed = 0
            let result = tmpReporter.getCountDisplay()
            expect(result).toBe('All went well !!')

            tmpReporter['_stateCounts'].failed = 1
            result = tmpReporter.getCountDisplay()
            expect(result).toBe('Test failed (1):')

            tmpReporter['_stateCounts'].failed = 2
            result = tmpReporter.getCountDisplay()
            expect(result).toBe('Tests failed (2):')
        })
    })

    describe('getFailureDisplay', () => {
        it('should return failing results', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => SUITES) as any
            tmpReporter['_suites'] = SUITES as any

            const result = tmpReporter.getFailureDisplay()

            expect(result.length).toBe(2)
            expect(result[0]).toBe('  Fail : red a failed test')
            expect(result[1]).toBe('    AssertionError [ERR_ASSERTION] : yellow \'Google\' == \'Google2\'')
        })

        it('should return no results', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => SUITES_NO_TESTS) as any
            tmpReporter['_suites'] = SUITES_NO_TESTS as any

            const result = tmpReporter.getFailureDisplay()

            expect(result.length).toBe(0)
        })
    })

    describe('getOrderedSuites', () => {
        it('should return the suites in order based on uids', () => {
            // @ts-expect-error
            tmpReporter.foo = 'hellooo'
            tmpReporter['_suiteUids'] = ['5', '3', '8']
            tmpReporter['_suites'] = [{ uid : '3' }, { uid : '5' }] as any

            const result = tmpReporter.getOrderedSuites()

            expect(result.length).toBe(2)
            expect(result[0]).toEqual({ uid : '5' })
            expect(result[1]).toEqual({ uid : '3' })
        })

        it('should return no suites', () => {
            expect(tmpReporter.getOrderedSuites().length).toBe(0)
        })
    })

    describe('getEnviromentCombo', () => {
        it('should return desktop combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                browserVersion: '50',
                platformName: 'Windows 8.1'
            })).toBe('chrome (v50) on Windows 8.1')
        })

        it('should return mobile combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                deviceName: 'iPhone 6 Plus',
                platformVersion: '9.2',
                platformName: 'iOS'
            })).toBe('iPhone 6 Plus on iOS 9.2')
        })

        it('should return mobile combo executing an app', () => {
            expect(tmpReporter.getEnviromentCombo({
                deviceName: 'iPhone 6 Plus',
                platformVersion: '9.2',
                platformName: 'iOS',
                app: 'sauce-storage:myApp.app'
            })).toBe('iPhone 6 Plus on iOS 9.2 executing myApp.app')
        })

        it('should return mobile combo executing a browser', () => {
            expect(tmpReporter.getEnviromentCombo({
                deviceName: 'iPhone 6 Plus',
                platformVersion: '9.2',
                platformName: 'iOS',
                browserName: 'Safari'
            })).toBe('iPhone 6 Plus on iOS 9.2 executing Safari')
        })

        it('should return desktop combo when using BrowserStack capabilities', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: '50',
                os: 'Windows',
                os_version: '10'
            })).toBe('Chrome (v50) on Windows 10')
        })
    })
})
