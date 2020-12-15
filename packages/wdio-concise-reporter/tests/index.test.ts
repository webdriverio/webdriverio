import ConciseReporter from '../src'
import {
    RUNNER,
    SUITE_UIDS,
    SUITES,
    SUITES_NO_TESTS,
    REPORT,
} from './fixtures'
// @ts-ignore
const reporter = new ConciseReporter({})

describe('ConciseReporter', () => {
    let tmpReporter = null

    beforeEach(() => {
        // @ts-ignore
        tmpReporter = new ConciseReporter({})
        // tmpReporter.chalk.level = 0
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
            reporter.printReport = jest.fn()
            reporter.onRunnerEnd(RUNNER as any)
            expect((reporter.printReport as jest.Mock).mock.calls.length).toBe(1)
            expect((reporter.printReport as jest.Mock).mock.calls[0][0]).toEqual(RUNNER)
        })
    })

    describe('printReport', () => {
        let printReporter = null

        beforeEach(() => {
            printReporter = new ConciseReporter({})
            printReporter.chalk.level = 0
            printReporter.write = jest.fn()
        })

        it('should print the report to the console', () => {
            printReporter.suiteUids = SUITE_UIDS
            printReporter.suites = SUITES
            printReporter.stateCounts = {
                failed : 1
            }

            printReporter.printReport(RUNNER)

            expect(printReporter.write).toBeCalledWith(REPORT)
        })

        it('should print default report because there are no failed tests', () => {
            printReporter.suiteUids = SUITE_UIDS
            printReporter.suites = SUITES_NO_TESTS

            printReporter.printReport(RUNNER)

            expect(printReporter.write.mock.calls.length).toBe(1)
        })
    })

    describe('getCountDisplay', () => {
        it('should return failing count', () => {
            tmpReporter.stateCounts.failed = 0
            let result = tmpReporter.getCountDisplay()
            expect(result).toBe('All went well !!')

            tmpReporter.stateCounts.failed = 1
            result = tmpReporter.getCountDisplay()
            expect(result).toBe('Test failed (1):')

            tmpReporter.stateCounts.failed = 2
            result = tmpReporter.getCountDisplay()
            expect(result).toBe('Tests failed (2):')
        })
    })

    describe('getFailureDisplay', () => {
        it('should return failing results', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES)
            tmpReporter.suites = SUITES

            const result = tmpReporter.getFailureDisplay()

            expect(result.length).toBe(2)
            expect(result[0]).toBe('  Fail : red a failed test')
            expect(result[1]).toBe('    AssertionError [ERR_ASSERTION] : yellow \'Google\' == \'Google2\'')
        })

        it('should return no results', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES_NO_TESTS)
            tmpReporter.suites = SUITES_NO_TESTS

            const result = tmpReporter.getFailureDisplay()

            expect(result.length).toBe(0)
        })
    })

    describe('getOrderedSuites', () => {
        it('should return the suites in order based on uids', () => {
            tmpReporter.foo = 'hellooo'
            tmpReporter.suiteUids = [5, 3, 8]
            tmpReporter.suites = [{ uid : 3 }, { uid : 5 }]

            const result = tmpReporter.getOrderedSuites()

            expect(result.length).toBe(2)
            expect(result[0]).toEqual({ uid : 5 })
            expect(result[1]).toEqual({ uid : 3 })

            expect(tmpReporter.orderedSuites.length).toBe(2)
            expect(tmpReporter.orderedSuites[0]).toEqual({ uid : 5 })
            expect(tmpReporter.orderedSuites[1]).toEqual({ uid : 3 })
        })

        it('should return no suites', () => {
            expect(tmpReporter.getOrderedSuites().length).toBe(0)
        })
    })

    describe('getEnviromentCombo', () => {
        it('should return desktop combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
                platform: 'Windows 8.1'
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
                browser_version: 50,
                os: 'Windows',
                os_version: '10'
            })).toBe('Chrome (v50) on Windows 10')
        })
    })
})
