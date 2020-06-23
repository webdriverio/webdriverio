import chalk from 'chalk'
import SpecReporter from '../src'
import {
    RUNNER,
    SUITE_UIDS,
    SUITES,
    SUITES_NO_TESTS,
    SUITES_WITH_DATA_TABLE,
    SUITES_NO_TESTS_WITH_HOOK_ERROR,
    SUITES_MULTIPLE_ERRORS
} from './__fixtures__/testdata'

const reporter = new SpecReporter({})

const defaultCaps = { browserName: 'loremipsum', version: 50, platform: 'Windows 10', sessionId: 'foobar' }
const fakeSessionId = 'ba86cbcb70774ef8a0757c1702c3bdf9'
const getRunnerConfig = (config = {}) => {
    return Object.assign({}, RUNNER, {
        capabilities: config.capabilities || defaultCaps,
        config,
        sessionId: fakeSessionId,
        isMultiremote: Boolean(config.isMultiremote)
    })
}

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
                tests: [{ type: 'test',  title: '1' }, { type: 'test',  title: '2' }],
                hooks: [{}],
                hooksAndTests: [{}, { type: 'test',  title: '11' }, {}, { type: 'test',  title: '22' }, {}]
            })).toEqual([{ type: 'test',  title: '11' }, { type: 'test',  title: '22' }])
            expect(tmpReporter.getEventsToReport({
                tests: [{ type: 'test',  title: '1' }, { type: 'test',  title: '2' }],
                hooks: [{ error: 1 }, {}, { error: 2 }],
                hooksAndTests: [{}, { error: 11 }, {}, { type: 'test',  title: '33' }, {}, { error: 22 }, {}]
            })).toEqual([{ error: 11 }, { type: 'test',  title: '33' }, { error: 22 }])
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

        describe('with normal setup', () => {
            beforeEach(() => {
                printReporter.suiteUids = SUITE_UIDS
                printReporter.suites = SUITES
                printReporter.stateCounts = {
                    passed : 4,
                    failed : 1,
                    skipped : 1,
                }
            })

            it('should print the report to the console', () => {
                const runner = getRunnerConfig({ hostname: 'localhost' })
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print link to Sauce Labs job details page', () => {
                const runner = getRunnerConfig({
                    hostname: 'ondemand.saucelabs.com'
                })
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print jobs of all instance when run with multiremote', () => {
                const runner = getRunnerConfig({
                    hostname: 'ondemand.saucelabs.com',
                    capabilities: {
                        browserA: { sessionId: 'foobar' },
                        browserB: { sessionId: 'barfoo' }
                    },
                    isMultiremote: true
                })
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print link to Sauce Labs job details page if run with Sauce Connect (w3c)', () => {
                const runner = getRunnerConfig({
                    capabilities: {
                        ...defaultCaps,
                        'sauce:options': 'foobar'
                    },
                    hostname: 'localhost'
                })
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print link to Sauce Labs job details page if run with Sauce Connect (jsonwp)', () => {
                const runner = getRunnerConfig({
                    capabilities: {
                        tunnelIdentifier: 'foobar',
                        ...defaultCaps
                    },
                    hostname: 'localhost'
                })
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print link to Sauce Labs EU job details page', () => {
                printReporter.printReport(getRunnerConfig({
                    hostname: 'ondemand.saucelabs.com',
                    region: 'eu'
                }))
                expect(printReporter.write.mock.calls).toMatchSnapshot()

                printReporter.write.mockClear()

                printReporter.printReport(getRunnerConfig({
                    hostname: 'ondemand.saucelabs.com',
                    region: 'eu-central-1'
                }))
                expect(printReporter.write.mock.calls).toMatchSnapshot()

                printReporter.printReport(getRunnerConfig({
                    hostname: 'ondemand.saucelabs.com',
                    headless: true
                }))
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })
        })

        it('should print report for suites with no tests but failed hooks', () => {
            printReporter.suiteUids = SUITE_UIDS
            printReporter.suites = SUITES_NO_TESTS_WITH_HOOK_ERROR

            const runner = getRunnerConfig({
                capabilities: {},
                hostname: 'localhost'
            })
            printReporter.printReport(runner)

            expect(printReporter.write.mock.calls.length).toBe(1)
            expect(printReporter.write.mock.calls[0][0]).toContain('a failed hook')
        })

        it('should not print the report because there are no tests', () => {
            printReporter.suiteUids = SUITE_UIDS
            printReporter.suites = SUITES_NO_TESTS

            printReporter.printReport(getRunnerConfig())

            expect(printReporter.write.mock.calls.length).toBe(0)
        })
    })

    describe('getHeaderDisplay', () => {
        it('should validate header output', () => {
            const result = reporter.getHeaderDisplay(getRunnerConfig())

            expect(result.length).toBe(3)
            expect(result[0]).toBe('Spec: /foo/bar/baz.js')
            expect(result[1]).toBe('Running: loremipsum (v50) on Windows 10')
        })

        it('should validate header output in multiremote', () => {
            const result = tmpReporter.getHeaderDisplay(
                getRunnerConfig({ isMultiremote: true }))

            expect(result.length).toBe(3)
            expect(result[0]).toBe('Spec: /foo/bar/baz.js')
            expect(result[1]).toBe('Running: MultiremoteBrowser (v50) on Windows 10')
        })
    })

    describe('getResultDisplay', () => {
        it('should validate the result output with tests', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES)
            tmpReporter.suites = SUITES

            const result = tmpReporter.getResultDisplay()
            expect(result).toMatchSnapshot()
        })

        it('should validate the result output with no tests', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES_NO_TESTS)
            tmpReporter.suites = SUITES_NO_TESTS

            const result = tmpReporter.getResultDisplay()
            expect(result.length).toBe(0)
        })

        it('should print data tables', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => SUITES_WITH_DATA_TABLE)
            tmpReporter.suites = SUITES_WITH_DATA_TABLE

            const result = tmpReporter.getResultDisplay()
            expect(result).toMatchSnapshot()
        })

        it('should not print if data table format is not given', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => {
                const suites = JSON.parse(JSON.stringify(SUITES_WITH_DATA_TABLE))
                suites[0].hooksAndTests[0].argument = 'some different format'
                return suites
            })
            const result = tmpReporter.getResultDisplay()
            expect(result).toMatchSnapshot()
        })

        it('should not print if data table is empty', () => {
            tmpReporter.getOrderedSuites = jest.fn(() => {
                const suites = JSON.parse(JSON.stringify(SUITES_WITH_DATA_TABLE))
                suites[0].hooksAndTests[0].argument.rows = []
                return suites
            })

            const result = tmpReporter.getResultDisplay()
            expect(result).toMatchSnapshot()
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

            expect(result.length).toBe(7)
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
        it('should return Multibrowser as capability if multiremote is used', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                platform: 'Windows 8.1'
            }, true, true)).toBe('MultiremoteBrowser on Windows 8.1')
        })

        it('should return Multibrowser as capability if multiremote is used without platform', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
            }, true, true)).toBe('MultiremoteBrowser on (unknown)')
        })

        it('should return verbose desktop combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
                platform: 'Windows 8.1'
            })).toBe('chrome (v50) on Windows 8.1')
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

        it('should return verbose desktop combo when using BrowserStack capabilities without os', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
            })).toBe('Chrome (v50) on (unknown)')
        })

        it('should return preface desktop combo when using BrowserStack capabilities without os', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
            }, false)).toBe('Chrome 50 (unknown)')
        })

        it('should return verbose desktop combo when using BrowserStack capabilities without os_version', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
                os: 'Windows',
            })).toBe('Chrome (v50) on Windows')
        })

        it('should return preface desktop combo when using BrowserStack capabilities without os_version', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
                os: 'Windows',
            }, false)).toBe('Chrome 50 Windows')
        })

        it('should return verbose desktop combo without platform', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
            })).toBe('chrome (v50) on (unknown)')
        })

        it('should return preface desktop combo without platform', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
            }, false)).toBe('chrome 50 (unknown)')
        })
    })
})
