import chalk from 'chalk'
import SpecReporter from '../src'
import {
    RUNNER,
    SUITE_UIDS,
    SUITES,
    SUITES_NO_TESTS,
    REPORT,
    SAUCELABS_REPORT,
    SAUCELABS_EU_REPORT,
    SAUCELABS_HEADLESS_REPORT,
    SUITES_NO_TESTS_WITH_HOOK_ERROR,
    SUITES_MULTIPLE_ERRORS
} from './__fixtures__/testdata'

const reporter = new SpecReporter({})

describe('SpecReporter', () => {
    let tmpReporter = null

    beforeEach(() => {
        tmpReporter = new SpecReporter({})
        tmpReporter.chalk.level = 0
    })

    describe('on create', () => {
        it('should verify initial properties', () => {
            expect(Array.isArray(reporter.suiteUids)).toBe(true)
            expect(reporter.suiteUids.length).toBe(0)
            expect(Array.isArray(reporter.suites)).toBe(true)
            expect(reporter.suites.length).toBe(0)
            expect(reporter.indents).toBe(0)
            expect(reporter.suiteIndents).toEqual({})
            expect(reporter.defaultTestIndent).toBe('   ')
            expect(reporter.stateCounts).toEqual({
                passed : 0,
                skipped : 0,
                failed : 0,
            })
            expect(reporter.chalk).toBe(chalk)
        })
    })

    describe('onSuiteStart', () => {
        beforeAll(() => {
            reporter.onSuiteStart(SUITES[0])
        })

        it('should add to suiteUids', () => {
            expect(reporter.suiteUids.length).toBe(1)
            expect(reporter.suiteUids[0]).toBe('Foo test1')
        })

        it('should increase suiteIndents', () => {
            expect(reporter.suiteIndents['Foo test1']).toBe(1)
        })
    })

    describe('onHookEnd', () => {
        it('should increase stateCount failures if hook failed', () => {
            expect(tmpReporter.stateCounts.failed).toBe(0)
            tmpReporter.onHookEnd({})
            expect(tmpReporter.stateCounts.failed).toBe(0)
            tmpReporter.onHookEnd({ error: new Error('boom!') })
            expect(tmpReporter.stateCounts.failed).toBe(1)
        })
    })

    describe('getEventsToReport', () => {
        it('should return all tests and hook errors to report', () => {
            expect(tmpReporter.getEventsToReport({
                tests: [1, 2, 3],
                hooks: [4, 5, 6]
            })).toEqual([1, 2, 3])
            expect(tmpReporter.getEventsToReport({
                tests: [1, 2, 3],
                hooks: [{ error: 1 }, 5, { error: 2 }]
            })).toEqual([1, 2, 3, { error: 1 }, { error: 2 }])
        })
    })

    describe('onTestPass', () => {
        beforeAll(() => {
            reporter.onTestPass()
        })

        it('should increase stateCounts.passed by 1', () => {
            expect(reporter.stateCounts.passed).toBe(1)
        })
    })

    describe('onTestFail', () => {
        beforeAll(() => {
            reporter.onTestFail()
        })

        it('should increase stateCounts.failed by 1', () => {
            expect(reporter.stateCounts.failed).toBe(1)
        })
    })

    describe('onTestSkip', () => {
        beforeAll(() => {
            reporter.onTestSkip()
        })

        it('should increase stateCounts.skipped by 1', () => {
            expect(reporter.stateCounts.skipped).toBe(1)
        })
    })

    describe('onSuiteEnd', () => {
        beforeAll(() => {
            reporter.onSuiteEnd(SUITES[0])
        })

        it('should decrease indents', () => {
            expect(reporter.indents).toBe(0)
        })

        it('should add the suite to the suites array', () => {
            expect(reporter.suites.length).toBe(1)
            expect(reporter.suites[0]).toBe(SUITES[0])
        })
    })

    describe('onRunnerEnd', () => {
        it('should call printReport method', () => {
            reporter.printReport = jest.fn()
            reporter.onRunnerEnd(RUNNER)

            expect(reporter.printReport.mock.calls.length).toBe(1)
            expect(reporter.printReport.mock.calls[0][0]).toEqual(RUNNER)
        })
    })

    describe('printReport', () => {
        let printReporter = null

        beforeEach(() => {
            printReporter = new SpecReporter({})
            printReporter.chalk.level = 0
            printReporter.write = jest.fn()
        })

        it('should print the report to the console', () => {
            printReporter.suiteUids = SUITE_UIDS
            printReporter.suites = SUITES
            printReporter.stateCounts = {
                passed : 4,
                failed : 1,
                skipped : 1,
            }

            printReporter.printReport(RUNNER)

            expect(printReporter.write).toBeCalledWith(REPORT)
        })

        it('should print link to SauceLabs job details page', () => {
            printReporter.suiteUids = SUITE_UIDS
            printReporter.suites = SUITES
            printReporter.stateCounts = {
                passed : 4,
                failed : 1,
                skipped : 1,
            }

            const runner = Object.assign({}, RUNNER, {
                config: { hostname: 'ondemand.saucelabs.com' },
                sessionId: 'ba86cbcb70774ef8a0757c1702c3bdf9'
            })
            printReporter.printReport(runner)

            expect(printReporter.write).toBeCalledWith(SAUCELABS_REPORT)
        })

        it('should print link to SauceLabs EU job details page', () => {
            printReporter.suiteUids = SUITE_UIDS
            printReporter.suites = SUITES
            printReporter.stateCounts = {
                passed : 4,
                failed : 1,
                skipped : 1,
            }

            printReporter.printReport(Object.assign({}, RUNNER, {
                config: {
                    hostname: 'ondemand.saucelabs.com',
                    region: 'eu'
                },
                sessionId: 'ba86cbcb70774ef8a0757c1702c3bdf9'
            }))
            expect(printReporter.write).toBeCalledWith(SAUCELABS_EU_REPORT)

            printReporter.write.mockClear()

            printReporter.printReport(Object.assign({}, RUNNER, {
                config: {
                    hostname: 'ondemand.saucelabs.com',
                    region: 'eu-central-1'
                },
                sessionId: 'ba86cbcb70774ef8a0757c1702c3bdf9'
            }))
            expect(printReporter.write).toBeCalledWith(SAUCELABS_EU_REPORT)

            printReporter.printReport(Object.assign({}, RUNNER, {
                config: {
                    hostname: 'ondemand.saucelabs.com',
                    headless: true
                },
                sessionId: 'ba86cbcb70774ef8a0757c1702c3bdf9'
            }))
            expect(printReporter.write).toBeCalledWith(SAUCELABS_HEADLESS_REPORT)
        })

        it('should print report for suites with no tests but failed hooks', () => {
            printReporter.suiteUids = SUITE_UIDS
            printReporter.suites = SUITES_NO_TESTS_WITH_HOOK_ERROR

            printReporter.printReport(RUNNER)

            expect(printReporter.write.mock.calls.length).toBe(1)
            expect(printReporter.write.mock.calls[0][0]).toContain('a failed hook')
        })

        it('should not print the report because there are no tests', () => {
            printReporter.suiteUids = SUITE_UIDS
            printReporter.suites = SUITES_NO_TESTS

            printReporter.printReport(RUNNER)

            expect(printReporter.write.mock.calls.length).toBe(0)
        })
    })

    describe('getHeaderDisplay', () => {
        it('should validate header output', () => {
            const result = reporter.getHeaderDisplay(RUNNER)

            expect(result.length).toBe(3)
            expect(result[0]).toBe('Spec: /foo/bar/baz.js')
            expect(result[1]).toBe('Running: loremipsum')
            expect(result[2]).toBe('')
        })
    })

    describe('getResultDisplay', () => {
        it('should validate the result output with tests', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES)
            tmpReporter.suites = SUITES

            const result = tmpReporter.getResultDisplay()

            expect(result.length).toBe(12)
            expect(result[0]).toBe('Foo test')
            expect(result[1]).toBe('   green ✓ foo')
            expect(result[2]).toBe('   green ✓ bar')
            expect(result[3]).toBe('')
            expect(result[4]).toBe('Bar test')
            expect(result[5]).toBe('   green ✓ some test')
            expect(result[6]).toBe('   red ✖ a failed test')
            expect(result[7]).toBe('')
            expect(result[8]).toBe('Baz test')
            expect(result[9]).toBe('   green ✓ foo bar baz')
            expect(result[10]).toBe('   cyan - a skipped test')
            expect(result[11]).toBe('')
        })

        it('should validate the result output with no tests', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES_NO_TESTS)
            tmpReporter.suites = SUITES_NO_TESTS

            const result = tmpReporter.getResultDisplay()

            expect(result.length).toBe(0)
        })
    })

    describe('getCountDisplay', () => {
        it('should return only passing counts', () => {
            tmpReporter.stateCounts.passed = 2
            const result = tmpReporter.getCountDisplay(5)

            expect(result.length).toBe(1)
            expect(result[0]).toBe('green 2 passing 5')
        })

        it('should return passing and failing counts', () => {
            tmpReporter.stateCounts.passed = 2
            tmpReporter.stateCounts.failed = 1
            const result = tmpReporter.getCountDisplay(5)

            expect(result.length).toBe(2)
            expect(result[0]).toBe('green 2 passing 5')
            expect(result[1]).toBe('red 1 failing')
        })

        it('should return failing and skipped counts', () => {
            tmpReporter.stateCounts.failed = 1
            tmpReporter.stateCounts.skipped = 2
            const result = tmpReporter.getCountDisplay(5)

            expect(result.length).toBe(2)
            expect(result[0]).toBe('red 1 failing 5')
            expect(result[1]).toBe('cyan 2 skipped')
        })

        it('should only display skipped with duration', () => {
            tmpReporter.stateCounts.skipped = 2
            const result = tmpReporter.getCountDisplay(5)

            expect(result.length).toBe(1)
            expect(result[0]).toBe('cyan 2 skipped 5')
        })
    })

    describe('getFailureDisplay', () => {
        it('should return failing results', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES)
            tmpReporter.suites = SUITES

            const result = tmpReporter.getFailureDisplay()

            expect(result.length).toBe(4)
            expect(result[0]).toBe('')
            expect(result[1]).toBe('1) Bar test a failed test')
            expect(result[2]).toBe('red expected foo to equal bar')
            expect(result[3]).toBe('gray Failed test stack trace')
        })

        it('should return no results', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES_NO_TESTS)
            tmpReporter.suites = SUITES_NO_TESTS

            const result = tmpReporter.getFailureDisplay()

            expect(result.length).toBe(0)
        })

        it('should return mutliple failing results if they exist', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES_MULTIPLE_ERRORS)
            tmpReporter.suites = SUITES_MULTIPLE_ERRORS

            const result = tmpReporter.getFailureDisplay()
            expect(result.length).toBe(6)
            expect(result[0]).toBe('')
            expect(result[1]).toBe('1) Bar test a test with two failures')
            expect(result[2]).toBe('red expected the party on the first part to be the party on the first part')
            expect(result[3]).toBe('gray First failed stack trace')
            expect(result[4]).toBe('red expected the party on the second part to be the party on the second part')
            expect(result[5]).toBe('gray Second failed stack trace')
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

        it('should return the cached ordered suites', () => {
            tmpReporter.foo = 'hellooo boo'
            tmpReporter.orderedSuites = ['foo', 'bar']
            const result = tmpReporter.getOrderedSuites()

            expect(result.length).toBe(2)
            expect(result[0]).toBe('foo')
            expect(result[1]).toBe('bar')
        })

        it('should return no suites', () => {
            expect(tmpReporter.getOrderedSuites().length).toBe(0)
        })
    })

    describe('indent', () => {
        const uid = 123

        it('should not indent', () => {
            tmpReporter.suiteIndents[uid] = 0
            const result = tmpReporter.indent(uid)

            expect(result).toBe('')
        })

        it('should indent', () => {
            tmpReporter.suiteIndents[uid] = 3
            const result = tmpReporter.indent(uid)

            expect(result).toBe('        ')
        })
    })

    describe('getSymbol', () => {
        it('should get the checkbox symbol', () => {
            expect(tmpReporter.getSymbol('passed')).toBe('✓')
        })

        it('should get the x symbol', () => {
            expect(tmpReporter.getSymbol('failed')).toBe('✖')
        })

        it('should get the - symbol', () => {
            expect(tmpReporter.getSymbol('skipped')).toBe('-')
        })

        it('should get the ? symbol', () => {
            expect(tmpReporter.getSymbol()).toBe('?')
        })
    })

    describe('getColor', () => {
        it('should get green', () => {
            expect(tmpReporter.getColor('passed')).toBe('green')
        })

        it('should get red', () => {
            expect(tmpReporter.getColor('failed')).toBe('red')
        })

        it('should get cyan', () => {
            expect(tmpReporter.getColor('skipped')).toBe('cyan')
            expect(tmpReporter.getColor('pending')).toBe('cyan')
        })

        it('should get null', () => {
            expect(tmpReporter.getColor()).toBe(null)
        })
    })

    describe('getEnviromentCombo', () => {
        it('should return verbose desktop combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
                platform: 'Windows 8.1'
            })).toBe('chrome (v50) on Windows 8.1')
        })

        it('should return Multibrowser as capability if multiremote is used', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome'
            }, true, true)).toBe('MultiremoteBrowser')
        })

        it('should return preface desktop combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
                platform: 'Windows 8.1'
            }, false)).toBe('chrome 50 Windows 8.1')
        })

        it('should return verbose mobile combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                deviceName: 'iPhone 6 Plus',
                platformVersion: '9.2',
                platformName: 'iOS'
            })).toBe('iPhone 6 Plus on iOS 9.2')
        })

        it('should return preface mobile combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                deviceName: 'iPhone 6 Plus',
                platformVersion: '9.2',
                platformName: 'iOS'
            }, false)).toBe('iPhone 6 Plus iOS 9.2')
        })

        it('should return verbose mobile combo executing an app', () => {
            expect(tmpReporter.getEnviromentCombo({
                deviceName: 'iPhone 6 Plus',
                platformVersion: '9.2',
                platformName: 'iOS',
                app: 'sauce-storage:myApp.app'
            })).toBe('iPhone 6 Plus on iOS 9.2 executing myApp.app')
        })

        it('should return preface mobile combo executing an app', () => {
            expect(tmpReporter.getEnviromentCombo({
                deviceName: 'iPhone 6 Plus',
                platformVersion: '9.2',
                platformName: 'iOS',
                app: 'sauce-storage:myApp.app'
            }, true)).toBe('iPhone 6 Plus on iOS 9.2 executing myApp.app')
        })

        it('should return verbose mobile combo executing a browser', () => {
            expect(tmpReporter.getEnviromentCombo({
                deviceName: 'iPhone 6 Plus',
                platformVersion: '9.2',
                platformName: 'iOS',
                browserName: 'Safari'
            })).toBe('iPhone 6 Plus on iOS 9.2 executing Safari')
        })

        it('should return preface mobile combo executing a browser', () => {
            expect(tmpReporter.getEnviromentCombo({
                deviceName: 'iPhone 6 Plus',
                platformVersion: '9.2',
                platformName: 'iOS',
                browserName: 'Safari'
            }, false)).toBe('iPhone 6 Plus iOS 9.2')
        })

        it('should return verbose desktop combo when using BrowserStack capabilities', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
                os: 'Windows',
                os_version: '10'
            })).toBe('Chrome (v50) on Windows 10')
        })

        it('should return preface desktop combo when using BrowserStack capabilities', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
                os: 'Windows',
                os_version: '10'
            }, false)).toBe('Chrome 50 Windows 10')
        })
    })
})
