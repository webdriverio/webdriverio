import path from 'node:path'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import ConciseReporter from '../src/index.js'
import { RUNNER, SUITES, REPORT } from './fixtures.js'

vi.mock('chalk')
vi.mock('@wdio/reporter', () => import(path.join(process.cwd(), '__mocks__', '@wdio/reporter')))

function conciseReport (environment: string, body: string) {
    return `yellow ========= Your concise report ==========
${environment}
${body}
`
}

describe('ConciseReporter', () => {
    let printReporter: ConciseReporter

    beforeEach(() => {
        printReporter = new ConciseReporter({})
        printReporter.write = vi.fn()
    })

    describe('onRunnerEnd', () => {
        it('should print the concise report for a failed run', () => {
            for (const suite of SUITES) {
                printReporter.onSuiteStart(suite as any)
            }
            printReporter.onTestFail()
            for (const suite of SUITES) {
                printReporter.onSuiteEnd(suite as any)
            }

            printReporter.onRunnerEnd(RUNNER as any)

            expect(printReporter.write).toHaveBeenCalledTimes(1)
            expect(printReporter.write).toHaveBeenCalledWith(REPORT)
        })

        it('should print the no-tests report when nothing ran', () => {
            printReporter.onRunnerEnd(RUNNER as any)

            expect(printReporter.write).toHaveBeenCalledTimes(1)
            expect(printReporter.write).toHaveBeenCalledWith(conciseReport(
                'chrome',
                '❌ Failed to setup tests, no tests found'
            ))
        })

        it('should print the all-clear report when every test passed', () => {
            // Failure totals live on this reporter. Passes stay on the base
            // counts object, which the reporter mock does not increment.
            printReporter.counts.tests = 1

            printReporter.onRunnerEnd(RUNNER as any)

            expect(printReporter.write).toHaveBeenCalledWith(conciseReport(
                'chrome',
                '✅ All went well!'
            ))
        })

        it('should print failures in suite start order and skip a suite that did not end', () => {
            const suiteFive = {
                uid : '5',
                tests : [{
                    state : 'failed',
                    title : 'suite five',
                    error : { type : 'Error', message : 'one' }
                }]
            }
            const suiteThree = {
                uid : '3',
                tests : [{
                    state : 'failed',
                    title : 'suite three',
                    error : { type : 'Error', message : 'two' }
                }]
            }
            const suiteEight = {
                uid : '8',
                tests : [{
                    state : 'failed',
                    title : 'suite eight',
                    error : { type : 'Error', message : 'three' }
                }]
            }

            printReporter.onSuiteStart(suiteFive as any)
            printReporter.onSuiteStart(suiteThree as any)
            printReporter.onSuiteStart(suiteEight as any)
            printReporter.onTestFail()
            printReporter.onTestFail()
            // End in the opposite order from start. Suite eight never ends.
            printReporter.onSuiteEnd(suiteThree as any)
            printReporter.onSuiteEnd(suiteFive as any)

            printReporter.onRunnerEnd(RUNNER as any)

            expect(printReporter.write).toHaveBeenCalledWith(conciseReport(
                'chrome',
                [
                    '❌ Tests failed (2):',
                    '  Fail : red suite five',
                    '    Error : yellow one',
                    '  Fail : red suite three',
                    '    Error : yellow two'
                ].join('\n')
            ))
        })

        it.each([
            ['desktop browser', {
                browserName : 'chrome',
                browserVersion : '50',
                platformName : 'Windows 8.1'
            }, 'chrome (v50) on Windows 8.1'],
            ['mobile device', {
                deviceName : 'iPhone 6 Plus',
                'appium:platformVersion' : '9.2',
                platformName : 'iOS'
            }, 'iPhone 6 Plus on iOS 9.2'],
            ['mobile app', {
                deviceName : 'iPhone 6 Plus',
                'appium:platformVersion' : '9.2',
                platformName : 'iOS',
                'appium:app' : 'sauce-storage:myApp.app'
            }, 'iPhone 6 Plus on iOS 9.2 executing myApp.app'],
            ['mobile browser', {
                deviceName : 'iPhone 6 Plus',
                'appium:platformVersion' : '9.2',
                platformName : 'iOS',
                browserName : 'Safari'
            }, 'iPhone 6 Plus on iOS 9.2 executing Safari'],
            ['BrowserStack desktop', {
                browser : 'Chrome',
                browser_version : '50',
                os : 'Windows',
                os_version : '10'
            }, 'Chrome (v50) on Windows 10']
        ] as const)('should print the %s environment', (_label, capabilities, environment) => {
            printReporter.onRunnerEnd({ ...RUNNER, capabilities } as any)

            expect(printReporter.write).toHaveBeenCalledWith(conciseReport(
                environment,
                '❌ Failed to setup tests, no tests found'
            ))
        })
    })
})
