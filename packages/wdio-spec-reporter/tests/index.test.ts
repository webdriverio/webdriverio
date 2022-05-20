import path from 'node:path'
import { describe, expect, it, vi, beforeEach, beforeAll } from 'vitest'
import { runnerEnd } from '../../wdio-allure-reporter/tests/__fixtures__/runner'
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

vi.mock('chalk')
vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

const reporter = new SpecReporter({})

const defaultCaps = { browserName: 'loremipsum', version: 50, platform: 'Windows 10', sessionId: 'foobar' }
const fakeSessionId = 'ba86cbcb70774ef8a0757c1702c3bdf9'
const getRunnerConfig = (config: any = {}) => {
    return Object.assign(JSON.parse(JSON.stringify(RUNNER)), {
        capabilities: config.capabilities || defaultCaps,
        config,
        sessionId: fakeSessionId,
        isMultiremote: Boolean(config.isMultiremote)
    })
}

describe('SpecReporter', () => {
    let tmpReporter: SpecReporter

    beforeEach(() => {
        tmpReporter = new SpecReporter({})
    })

    describe('on create', () => {
        it('should verify initial properties', () => {
            expect(reporter['_suiteUids'].size).toBe(0)
            expect(reporter['_indents']).toBe(0)
            expect(reporter['_suiteIndents']).toEqual({})
            expect(reporter['_stateCounts']).toEqual({
                passed: 0,
                skipped: 0,
                failed: 0,
            })
        })
    })

    describe('onSuiteStart', () => {
        beforeAll(() => {
            reporter.onSuiteStart(Object.values(SUITES)[0] as any)
        })

        it('should add to suiteUids', () => {
            expect(reporter['_suiteUids'].size).toBe(1)
            expect([...reporter['_suiteUids'].values()][0]).toBe('Foo test1')
        })

        it('should increase suiteIndents', () => {
            expect(reporter['_suiteIndents']['Foo test1']).toBe(1)
        })
    })

    describe('onHookEnd', () => {
        it('should increase stateCount failures if hook failed', () => {
            expect(tmpReporter['_stateCounts'].failed).toBe(0)
            tmpReporter.onHookEnd({} as any)
            expect(tmpReporter['_stateCounts'].failed).toBe(0)
            tmpReporter.onHookEnd({ error: new Error('boom!') } as any)
            expect(tmpReporter['_stateCounts'].failed).toBe(1)
        })
    })

    describe('getEventsToReport', () => {
        it('should return all tests and hook errors to report', () => {
            expect(tmpReporter.getEventsToReport({
                tests: [{ type: 'test', title: '1' }, { type: 'test', title: '2' }],
                hooks: [{}],
                hooksAndTests: [{}, { type: 'test', title: '11' }, {}, { type: 'test', title: '22' }, {}]
            } as any)).toEqual([{ type: 'test', title: '11' }, { type: 'test', title: '22' }])
            expect(tmpReporter.getEventsToReport({
                tests: [{ type: 'test', title: '1' }, { type: 'test', title: '2' }],
                hooks: [{ error: 1 }, {}, { error: 2 }],
                hooksAndTests: [{}, { error: 11 }, {}, { type: 'test', title: '33' }, {}, { error: 22 }, {}]
            } as any)).toEqual([{ error: 11 }, { type: 'test', title: '33' }, { error: 22 }])
        })
    })

    describe('onTestPass', () => {
        beforeAll(() => {
            reporter.onTestPass({
                title:'test1',
                state:'passed'
            } as any)
        })

        it('should increase stateCounts.passed by 1', () => {
            expect(reporter['_stateCounts'].passed).toBe(1)
        })
    })

    describe('onTestFail', () => {
        beforeAll(() => {
            reporter.onTestFail({
                title:'test1',
                state:'failed'
            } as any)
        })

        it('should increase stateCounts.failed by 1', () => {
            expect(reporter['_stateCounts'].failed).toBe(1)
        })
    })

    describe('onTestSkip', () => {
        beforeAll(() => {
            reporter.onTestSkip({
                title:'test1',
                state:'skipped'
            } as any)
        })

        it('should increase stateCounts.skipped by 1', () => {
            expect(reporter['_stateCounts'].skipped).toBe(1)
        })
    })

    describe('onSuiteEnd', () => {
        beforeAll(() => {
            reporter.onSuiteEnd()
        })

        it('should decrease indents', () => {
            expect(reporter['_indents']).toBe(0)
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
        let printReporter: any = null

        beforeEach(() => {
            printReporter = new SpecReporter({})
            printReporter.write = vi.fn()
            printReporter.runnerStat = {
                instanceOptions: {
                    [fakeSessionId]: {}
                }
            } as any
        })

        describe('with normal setup', () => {
            beforeEach(() => {
                printReporter['_suiteUids'] = SUITE_UIDS
                printReporter.suites = SUITES
                printReporter['_stateCounts'] = {
                    passed: 4,
                    failed: 1,
                    skipped: 1,
                }
            })

            it('should print the report to the console', () => {
                const runner = getRunnerConfig({ hostname: 'localhost' })
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print link to Sauce Labs job details page for VDC', () => {
                const options = {
                    hostname: 'ondemand.saucelabs.com',
                    user: 'foobar',
                    key: '123'
                }
                const runner = getRunnerConfig({})
                printReporter.runnerStat.instanceOptions[fakeSessionId] = options
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print link to Sauce Labs job details page for RDC', () => {
                const options = {
                    hostname: 'ondemand.saucelabs.com',
                    user: 'foobar',
                    key: '123'
                }
                const runner = getRunnerConfig({
                    capabilities: {
                        browserName: 'safari',
                        deviceName: 'udid-serial-of-device',
                        platformVersion: '14.3',
                        platformName: 'iOS',
                        testobject_test_report_url: ' https://app.eu-central-1.saucelabs.com/tests/c752c683e0874da4b1dad593ce6645b2'
                    },
                    sessionId: 'c752c683e0874da4b1dad593ce6645b2',
                })
                printReporter.runnerStat.instanceOptions[fakeSessionId] = options
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print jobs of all instance when run with multiremote', () => {
                const options = {
                    hostname: 'ondemand.saucelabs.com',
                    user: 'foobar',
                    key: '123'
                }
                const runner = getRunnerConfig({
                    capabilities: {
                        browserA: { sessionId: 'foobar' },
                        browserB: { sessionId: 'barfoo' }
                    },
                    isMultiremote: true
                })
                printReporter.runnerStat.instanceOptions['foobar'] = options
                printReporter.runnerStat.instanceOptions['barfoo'] = options
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print link to Sauce Labs job details page if run with Sauce Connect (w3c)', () => {
                const runner = getRunnerConfig({
                    capabilities: {
                        ...defaultCaps,
                        'sauce:options': 'foobar'
                    },
                    sessionId: fakeSessionId
                })
                printReporter.runnerStat.instanceOptions[fakeSessionId] = {
                    hostname: 'ondemand.us-west-1.saucelabs.com',
                    user: 'foobar',
                    key: '123'
                }
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print link to Sauce Labs job details page if run with Sauce Connect (jsonwp)', () => {
                const runner = getRunnerConfig({
                    capabilities: {
                        tunnelIdentifier: 'foobar',
                        ...defaultCaps
                    },
                    sessionId: fakeSessionId
                })
                printReporter.runnerStat.instanceOptions[fakeSessionId] = {
                    hostname: 'ondemand.saucelabs.com',
                    user: 'foobar',
                    key: '123'
                }
                printReporter.printReport(runner)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('should print link to Sauce Labs for many regions', () => {
                printReporter.runnerStat.instanceOptions[fakeSessionId] = {
                    hostname: 'ondemand.eu-central-1.saucelabs.com',
                    user: 'foobar',
                    key: '123'
                }
                printReporter.printReport(getRunnerConfig({}))
                expect(printReporter.write.mock.calls).toMatchSnapshot()

                printReporter.write.mockClear()

                printReporter.runnerStat.instanceOptions[fakeSessionId] = {
                    hostname: 'ondemand.saucelabs.com',
                    user: 'foobar',
                    key: '123',
                    region: 'apac'
                }
                printReporter.printReport(getRunnerConfig({}))
                expect(printReporter.write.mock.calls).toMatchSnapshot()

                printReporter.write.mockClear()

                printReporter.runnerStat.instanceOptions[fakeSessionId] = {
                    hostname: 'ondemand.us-east-1.saucelabs.com',
                    user: 'foobar',
                    key: '123'
                }
                printReporter.printReport(getRunnerConfig({}))
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })
        })

        describe('with disabled sharable Sauce report links', () => {
            const options = { sauceLabsSharableLinks: false }
            beforeEach(() => {
                tmpReporter = new SpecReporter(options)
                // tmpReporter.suiteUids = SUITE_UIDS
                // tmpReporter.suites = SUITES
                // tmpReporter.stateCounts = {
                //     passed: 4,
                //     failed: 1,
                //     skipped: 1,
                // }
                tmpReporter.write = vi.fn()
            })

            it('should print the default Sauce Labs job details page link', () => {
                const runner = getRunnerConfig({
                    hostname: 'ondemand.saucelabs.com',
                    user: 'foobar',
                    key: '123',
                })
                tmpReporter.printReport(runner)
                expect(vi.mocked(tmpReporter.write).mock.calls).toMatchSnapshot()
            })
        })

        it('should print report for suites with no tests but failed hooks', () => {
            printReporter['_suiteUids'] = SUITE_UIDS
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
            printReporter['_suiteUids'] = SUITE_UIDS
            printReporter.suites = SUITES_NO_TESTS

            printReporter.printReport(getRunnerConfig())

            expect(printReporter.write.mock.calls.length).toBe(0)
        })
    })

    describe('getHeaderDisplay', () => {
        it('should validate header output', () => {
            const result = reporter.getHeaderDisplay(getRunnerConfig() as any)
            expect(result).toMatchSnapshot()
        })

        it('should list multiple specs', () => {
            const config = getRunnerConfig() as any
            config.specs.push('/foo/bar/loo.js', '/bar/foo/baz.js')
            const result = reporter.getHeaderDisplay(config)
            expect(result).toMatchSnapshot()
        })

        it('should validate header output in multiremote', () => {
            const result = tmpReporter.getHeaderDisplay(
                getRunnerConfig({
                    capabilities: {
                        browserA: { browserName: 'chrome' },
                        browserB: { browserName: 'firefox' }
                    },
                    isMultiremote: true,
                }))

            expect(result).toMatchSnapshot()
        })
    })

    describe('getResultDisplay', () => {
        it('should validate the result output with tests', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => Object.values(SUITES)) as any
            const result = tmpReporter.getResultDisplay()
            expect(result).toMatchSnapshot()
        })

        it('should validate the result output with no tests', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => Object.values(SUITES_NO_TESTS)) as any
            const result = tmpReporter.getResultDisplay()
            expect(result.length).toBe(0)
        })

        it('should print data tables', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => Object.values(SUITES_WITH_DATA_TABLE)) as any
            const result = tmpReporter.getResultDisplay()
            expect(result).toMatchSnapshot()
        })

        it('should not print if data table format is not given', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => {
                const suites = Object.values(JSON.parse(JSON.stringify(SUITES_WITH_DATA_TABLE))) as any[]
                suites[0].hooksAndTests[0].argument = 'some different format'
                return suites
            })
            const result = tmpReporter.getResultDisplay()
            expect(result).toMatchSnapshot()
        })

        it('should not print if data table is empty', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => {
                const suites = Object.values(JSON.parse(JSON.stringify(SUITES_WITH_DATA_TABLE))) as any[]
                suites[0].hooksAndTests[0].argument.rows = []
                return suites
            })

            const result = tmpReporter.getResultDisplay()
            expect(result).toMatchSnapshot()
        })
    })

    describe('getCountDisplay', () => {
        it('should return only passing counts', () => {
            tmpReporter['_stateCounts'].passed = 2
            const result = tmpReporter.getCountDisplay('5')

            expect(result.length).toBe(1)
            expect(result[0]).toBe('green 2 passing 5')
        })

        it('should return passing and failing counts', () => {
            tmpReporter['_stateCounts'].passed = 2
            tmpReporter['_stateCounts'].failed = 1
            const result = tmpReporter.getCountDisplay('5')

            expect(result.length).toBe(2)
            expect(result[0]).toBe('green 2 passing 5')
            expect(result[1]).toBe('red 1 failing')
        })

        it('should return failing and skipped counts', () => {
            tmpReporter['_stateCounts'].failed = 1
            tmpReporter['_stateCounts'].skipped = 2
            const result = tmpReporter.getCountDisplay('5')

            expect(result.length).toBe(2)
            expect(result[0]).toBe('red 1 failing 5')
            expect(result[1]).toBe('cyan 2 skipped')
        })

        it('should only display skipped with duration', () => {
            tmpReporter['_stateCounts'].skipped = 2
            const result = tmpReporter.getCountDisplay('5')

            expect(result.length).toBe(1)
            expect(result[0]).toBe('cyan 2 skipped 5')
        })
    })

    describe('getFailureDisplay', () => {
        it('should return failing results', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => Object.values(SUITES)) as any
            const result = tmpReporter.getFailureDisplay()

            expect(result.length).toBe(7)
            expect(result[0]).toBe('')
            expect(result[1]).toBe('1) Bar test a failed test')
            expect(result[2]).toBe('red expected foo to equal bar')
            expect(result[3]).toBe('gray Failed test stack trace')
        })

        it('should return no results', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => Object.values(SUITES_NO_TESTS)) as any
            const result = tmpReporter.getFailureDisplay()

            expect(result.length).toBe(0)
        })

        it('should return mutliple failing results if they exist', () => {
            tmpReporter.getOrderedSuites = vi.fn(() => Object.values(SUITES_MULTIPLE_ERRORS)) as any
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
            tmpReporter['_suiteUids'] = new Set(['5', '3', '8'])
            tmpReporter.suites = { '3': { uid: 3 }, '5': { uid: 5 } } as any

            const result = tmpReporter.getOrderedSuites()

            expect(result.length).toBe(2)
            expect(result[0]).toEqual({ uid: 5 })
            expect(result[1]).toEqual({ uid: 3 })

            expect(tmpReporter['_orderedSuites'].length).toBe(2)
            expect(tmpReporter['_orderedSuites'][0]).toEqual({ uid: 5 })
            expect(tmpReporter['_orderedSuites'][1]).toEqual({ uid: 3 })
        })

        it('should return the cached ordered suites', () => {
            tmpReporter['_orderedSuites'] = ['foo', 'bar'] as any
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
        const uid = '123'

        it('should not indent', () => {
            tmpReporter['_suiteIndents'][uid] = 0
            const result = tmpReporter.indent(uid)

            expect(result).toBe('')
        })

        it('should indent', () => {
            tmpReporter['_suiteIndents'][uid] = 3
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

    describe('custom getSymbol', () => {
        const options = { symbols: { passed: 'Y', failed: 'N' } }
        beforeEach(() => {
            tmpReporter = new SpecReporter(options)
        })

        it('should get new passed symbol', () => {
            expect(tmpReporter.getSymbol('passed')).toBe(options.symbols.passed)
        })

        it('should get new failed symbol', () => {
            expect(tmpReporter.getSymbol('failed')).toBe(options.symbols.failed)
        })

        it('should get the skipped symbol that is not set', () => {
            expect(tmpReporter.getSymbol('skipped')).toBe('-')
        })
    })

    describe('add console logs', () => {
        const options = { addConsoleLogs: true }

        it('should add console log to report for passing test', () => {
            tmpReporter = new SpecReporter(options)
            tmpReporter.onSuiteStart(Object.values(SUITES)[0] as any)
            tmpReporter.onTestStart()
            tmpReporter['_orderedSuites'] = Object.values(SUITES) as any
            tmpReporter['_consoleOutput']='Printing to console spec'
            tmpReporter.onTestPass({
                title:'test1',
                state:'passed'
            } as any)
            expect(tmpReporter.getResultDisplay().toString()).toContain('Printing to console spec')
            tmpReporter.onSuiteEnd()
            tmpReporter.onRunnerEnd(runnerEnd())
        })

        it('should add console logs to report for failing test', () => {
            tmpReporter = new SpecReporter(options)
            tmpReporter.onSuiteStart(Object.values(SUITES)[0] as any)
            tmpReporter.onTestStart()
            tmpReporter['_orderedSuites'] = Object.values(SUITES) as any
            tmpReporter['_consoleOutput']='Printing to console spec'
            tmpReporter.onTestFail({
                title:'test1',
                state:'failed'
            } as any)
            expect(tmpReporter.getResultDisplay().toString()).toContain('Printing to console spec')
            tmpReporter.onSuiteEnd()
            tmpReporter.onRunnerEnd(runnerEnd())
        })

        it('should add console logs to report for skipping test', () => {
            tmpReporter = new SpecReporter(options)
            tmpReporter.onSuiteStart(Object.values(SUITES)[0] as any)
            tmpReporter.onTestStart()
            tmpReporter['_orderedSuites'] = Object.values(SUITES) as any
            tmpReporter['_consoleOutput']='Printing to console spec'
            tmpReporter.onTestSkip({
                title:'test1',
                state:'skipped'
            } as any)
            expect(tmpReporter.getResultDisplay().toString()).toContain('Printing to console spec')
            tmpReporter.onSuiteEnd()
            tmpReporter.onRunnerEnd(runnerEnd())
        })

        it('should not add webdriver logs to report', () => {
            tmpReporter = new SpecReporter(options)
            tmpReporter.onSuiteStart(Object.values(SUITES)[0] as any)
            tmpReporter['_orderedSuites'] = Object.values(SUITES) as any
            tmpReporter['_consoleOutput']='mwebdriver test log'
            expect(tmpReporter.getResultDisplay().toString()).not.toContain('mwebdriver test log')
            tmpReporter.onSuiteEnd()
            tmpReporter.onRunnerEnd(runnerEnd())
        })
    })

    describe('onlyFailures', () => {
        let printReporter: any = null
        const runner = getRunnerConfig({ hostname: 'localhost' })

        describe('false', () => {
            beforeEach(() => {
                printReporter = new SpecReporter({ onlyFailures: false })
                printReporter.write = vi.fn()
                printReporter['_suiteUids'] = SUITE_UIDS
                printReporter.suites = SUITES
            })

            it('1 failure', () => {
                runner.failures = 1
                printReporter.printReport(runner)

                expect(printReporter['_onlyFailures']).toBe(false)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('0 failures', () => {
                runner.failures = 0
                printReporter.printReport(runner)

                expect(printReporter['_onlyFailures']).toBe(false)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })
        })

        describe('true', () => {
            beforeEach(() => {
                printReporter = new SpecReporter({ onlyFailures: true })
                printReporter.write = vi.fn()
                printReporter['_suiteUids'] = SUITE_UIDS
                printReporter.suites = SUITES
            })

            it('1 failure', () => {
                runner.failures = 1
                printReporter.printReport(runner)

                expect(printReporter['_onlyFailures']).toBe(true)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })

            it('0 failures', () => {
                runner.failures = 0
                printReporter.printReport(runner)

                expect(printReporter['_onlyFailures']).toBe(true)
                expect(printReporter.write.mock.calls).toMatchSnapshot()
            })
        })
    })

    describe('showPreface', () => {
        let printReporter = null
        const runner = getRunnerConfig({ hostname: 'localhost' })
        it('false', () => {
            printReporter = new SpecReporter({ showPreface: false })
            printReporter.write = vi.fn()
            printReporter['_suiteUids'] = SUITE_UIDS
            printReporter.printReport(runner)

            expect(printReporter['_showPreface']).toBe(false)
            expect(vi.mocked(printReporter.write).mock.calls).toMatchSnapshot()
        })

        it('true', () => {
            printReporter = new SpecReporter({ showPreface: true })
            printReporter.write = vi.fn()
            printReporter['_suiteUids'] = SUITE_UIDS
            printReporter.printReport(runner)

            expect(printReporter['_showPreface']).toBe(true)
            expect(vi.mocked(printReporter.write).mock.calls).toMatchSnapshot()
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
            expect(tmpReporter.getColor()).toBe('gray')
        })
    })

    describe('getEnviromentCombo', () => {
        it('should return Multibrowser as capability if multiremote is used', () => {
            expect(tmpReporter.getEnviromentCombo({
                myBrowser: {
                    browserName: 'chrome',
                    platform: 'Windows 8.1'
                }
            } as any, true, true)).toBe('MultiremoteBrowser on chrome')
        })

        it('should return verbose desktop combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
                platform: 'Windows 8.1'
            } as any)).toBe('chrome (v50) on Windows 8.1')
        })

        it('should return preface desktop combo', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
                platform: 'Windows 8.1'
            } as any, false)).toBe('chrome 50 Windows 8.1')
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
            } as any)).toBe('Chrome (v50) on Windows 10')
        })

        it('should return preface desktop combo when using BrowserStack capabilities', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
                os: 'Windows',
                os_version: '10'
            } as any, false)).toBe('Chrome 50 Windows 10')
        })

        it('should return verbose desktop combo when using BrowserStack capabilities without os', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
            } as any)).toBe('Chrome (v50) on (unknown)')
        })

        it('should return preface desktop combo when using BrowserStack capabilities without os', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
            } as any, false)).toBe('Chrome 50 (unknown)')
        })

        it('should return verbose desktop combo when using BrowserStack capabilities without os_version', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
                os: 'Windows',
            } as any)).toBe('Chrome (v50) on Windows')
        })

        it('should return preface desktop combo when using BrowserStack capabilities without os_version', () => {
            expect(tmpReporter.getEnviromentCombo({
                browser: 'Chrome',
                browser_version: 50,
                os: 'Windows',
            } as any, false)).toBe('Chrome 50 Windows')
        })

        it('should return verbose desktop combo without platform', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
            } as any)).toBe('chrome (v50) on (unknown)')
        })

        it('should return preface desktop combo without platform', () => {
            expect(tmpReporter.getEnviromentCombo({
                browserName: 'chrome',
                version: 50,
            } as any, false)).toBe('chrome 50 (unknown)')
        })
    })

    describe('add real time report', () => {
        const options = { realtimeReporting: true }

        it('should call printCurrentStats for passing test', () => {
            tmpReporter = new SpecReporter(options)
            vi.spyOn(tmpReporter, 'printCurrentStats')
            tmpReporter.onSuiteStart(Object.values(SUITES)[0] as any)
            tmpReporter.onTestStart()
            tmpReporter['_orderedSuites'] = Object.values(SUITES) as any
            tmpReporter['_consoleOutput']='Printing to console spec'
            tmpReporter.onTestPass({
                title:'test1',
                state:'passed'
            } as any)
            expect(tmpReporter.printCurrentStats).toBeCalledWith({
                title:'test1',
                state:'passed'
            })
            tmpReporter.onSuiteEnd()
            tmpReporter.onRunnerEnd(runnerEnd())
        })

        it('should call printCurrentStats for falling test', () => {
            tmpReporter = new SpecReporter(options)
            vi.spyOn(tmpReporter, 'printCurrentStats')
            tmpReporter.onSuiteStart(Object.values(SUITES)[0] as any)
            tmpReporter.onTestStart()
            tmpReporter['_orderedSuites'] = Object.values(SUITES) as any
            tmpReporter['_consoleOutput']='Printing to console spec'
            tmpReporter.onTestPass({
                title:'test1',
                state:'failed'
            } as any)
            expect(tmpReporter.printCurrentStats).toBeCalledWith({
                title:'test1',
                state:'failed'
            })
            tmpReporter.onSuiteEnd()
            tmpReporter.onRunnerEnd(runnerEnd())
        })

        it('should call printCurrentStats skipped test', () => {
            tmpReporter = new SpecReporter(options)
            vi.spyOn(tmpReporter, 'printCurrentStats')
            tmpReporter.onSuiteStart(Object.values(SUITES)[0] as any)
            tmpReporter.onTestStart()
            tmpReporter['_orderedSuites'] = Object.values(SUITES) as any
            tmpReporter['_consoleOutput']='Printing to console spec'
            tmpReporter.onTestPass({
                title:'test1',
                state:'skipped'
            } as any)
            expect(tmpReporter.printCurrentStats).toBeCalledWith({
                title:'test1',
                state:'skipped'
            })
            tmpReporter.onSuiteEnd()
            tmpReporter.onRunnerEnd(runnerEnd())
        })
    })

    it('should call printCurrentStats on Hook complete', () => {
        tmpReporter = new SpecReporter({ realtimeReporting : false })
        vi.spyOn(tmpReporter, 'printCurrentStats')
        tmpReporter.onSuiteStart(Object.values(SUITES)[0] as any)
        tmpReporter.onTestStart()
        tmpReporter['_orderedSuites'] = Object.values(SUITES) as any
        tmpReporter['_consoleOutput']='Printing to console spec'
        tmpReporter.onHookEnd({
            title:'test1',
            state:'failed'
        } as any)
        expect(tmpReporter.printCurrentStats).toBeCalledWith({
            title:'test1',
            state:'failed'
        })
        tmpReporter.onSuiteEnd()
        tmpReporter.onRunnerEnd(runnerEnd())
    })
})
