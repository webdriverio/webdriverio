import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import assert from 'node:assert'

import { sleep } from '../packages/wdio-utils/build/utils.js'
import { SevereServiceError } from '../packages/node_modules/webdriverio/build/index.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const baseConfig = path.resolve(__dirname, 'helpers', 'config.js')
const parallelMultiRemoteBaseConfig = path.resolve(__dirname, 'helpers', 'parallel-multiremote-config.js')
const jasmineConfig = path.resolve(__dirname, 'helpers', 'configJasmine.js')
const allPassedConfig = path.resolve(__dirname, 'tests-cli-spec-arg/wdio-with-all-passed.conf.js')
const noArgConfig = path.resolve(__dirname, 'tests-cli-spec-arg/wdio-with-no-arg.conf.js')
const severalPassedConfig = path.resolve(__dirname, 'tests-cli-spec-arg/wdio-with-failed.conf.js')

import launch from './helpers/launch.js'
import {
    SERVICE_LOGS,
    LAUNCHER_LOGS,
    REPORTER_LOGS,
    JASMINE_REPORTER_LOGS,
    CUCUMBER_REPORTER_LOGS,
} from './helpers/fixtures.js'

async function fileExists (path) {
    try {
        await fs.access(path)
        return true
    } catch {
        return false
    }
}

async function runTests (tests) {
    /**
     * Usage example: `npm run test:smoke -- customService`
     */
    const testFilter = process.argv[2]

    if (process.env.CI || testFilter) {
        const testsFiltered = testFilter ? tests.filter(test => test.name === testFilter) : tests

        if (testsFiltered.length === 0) {
            throw new Error(
                `No test was selected! Smoke test "${testFilter}" ` +
                `picked but only ${tests.map(test => test.name).join(', ')} available`
            )
        }

        // sequential
        for (const test of testsFiltered) {
            await test()
        }
    } else {
        // parallel
        await Promise.all(tests.map(test => test().catch((err) => {
            throw new Error(`Smoke test failed with name ${test.name}, ${err.stack}`)
        })))
    }
}

/**
 * Mocha wdio testrunner tests
 */
const mochaTestrunner = async () => {
    const { skippedSpecs } = await launch('mochaTestrunner', baseConfig, {
        specs: [
            '../mocha/test.ts',
            path.resolve(__dirname, 'mocha', 'test-middleware.ts'),
            path.resolve(__dirname, 'mocha', 'test-waitForElement.ts'),
            path.resolve(__dirname, 'mocha', 'test-skipped.ts'),
            path.resolve(__dirname, 'mocha', 'cjs', 'test-cjs.js')
        ]
    })

    /**
     * assertion fails in Windows
     * ToDo(Christian): fix
     */
    if (process.platform === 'win32') {
        return
    }
    assert.strictEqual(skippedSpecs, 1)
}

/**
 * Mocha wdio testrunner tests with asynchronous execution, also checks
 * if `spec` CLI arguments are relative to cwd
 */
const mochaAsyncTestrunner = async () => {
    const { skippedSpecs } = await launch(
        'mochaAsyncTestrunner',
        path.resolve(__dirname, 'helpers', 'command.hook.config.js'),
        {
            spec: ['./tests/mocha/test-async.ts']
        }
    )
    assert.strictEqual(skippedSpecs, 0)
}

/**
 * Test if you can run CJS tests
 */
const cjsTestrunner = async () => {
    const { skippedSpecs } = await launch('cjsTestrunner', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'mocha', 'cjs', 'test-cjs.js')]
    })
    assert.strictEqual(skippedSpecs, 0)
}

/**
 * Jasmine wdio testrunner tests
 */
const jasmineTestrunner = async () => {
    const logFile = path.resolve(__dirname, 'helpers', 'expectationResults.log')
    await fs.rm(logFile, { force: true })
    const { skippedSpecs } = await launch('jasmineTestrunner', jasmineConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [
            path.resolve(__dirname, 'jasmine', 'test.js'),
            path.resolve(__dirname, 'jasmine', 'test-skipped.js')
        ],
        framework: 'jasmine'
    })
    /**
     * assertion fails in Windows
     * ToDo(Christian): fix
     */
    if (process.platform === 'win32') {
        return
    }

    assert.strictEqual(skippedSpecs, 1)
    assert.equal(
        (await fs.readFile(logFile, 'utf-8')).toString(),
        [
            'expect(number).toBe(number)',
            'expect(number).toBe(number)',
            'expect(number).toBe(number)',
            'expect(object).toEqual(object)',
            'expect(object).toBeFalse(boolean)',
            'expect(object).toHaveTitle(object)',
            'expect(object).toHaveTitle(object)',
            'expect(object).toHaveUrl(object)',
            'expect(object).toHaveUrl(object)',
            'expect(string).toHaveTitle(object)',
            'expect(object).toBeDisplayed(object)',
            'expect(object).toBeDisplayed(object)',
            'expect(number).toBe(number)',
            'expect(number).toBe(number)',
            'expect(object).toBeDefined(function)',
            'expect(function).toBeInstanceOf(function)',
            'expect(object).testMatcher(number)',
            ''
        ].join('\n')
    )
}

/**
 * Jasmine reporter
 */
const jasmineReporter = async () => {
    await launch('jasmineReporter', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'jasmine', 'reporter.js')],
        reporters: [['smoke-test', { foo: 'bar' }]],
        framework: 'jasmine',
        outputDir: __dirname + '/jasmine'
    }).catch((err) => err) // error expected
    await sleep(100)
    const reporterLogsPath = path.join(__dirname, 'jasmine', 'wdio-0-0-smoke-test-reporter.log')
    const reporterLogs = await fs.readFile(reporterLogsPath)
    assert.equal(reporterLogs.toString(), JASMINE_REPORTER_LOGS)
    await fs.unlink(reporterLogsPath)
}

/**
 * Jasmine timeout test
 */
const jasmineTimeout = async () => {
    const logFile = path.join(__dirname, 'jasmineTimeout.spec.log')
    await launch('jasmineTimeout', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'jasmine', 'test-timeout.js')],
        reporters: [
            ['spec', {
                outputDir: __dirname,
                stdout: false,
                logFile
            }]
        ],
        framework: 'jasmine'
    }).catch((err) => err) // error expected

    // eslint-disable-next-line no-control-regex
    const specLogs = (await fs.readFile(logFile)).toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    assert.ok(
        specLogs.includes('Error: Timeout - Async function did not complete within 1000ms (custom timeout)'),
        'spec was not failing due to timeout error'
    )
    assert.ok(
        specLogs.includes('at listOnTimeout (node:internal'),
        'spec was not failing a sync assertion error'
    )
    assert.ok(
        !specLogs.includes('RangeError: Maximum call stack size exceeded'),
        'spec was failing due to unexpected "Maximum call stack size exceeded"'
    )
    assert.ok(
        specLogs.includes('✓ should allow also async assertions afterwards'),
        'spec should also allow async assertions afterwards'
    )
}

/**
 * Jasmine afterAll is wrongly reported as a failing test - issue #8979
 * https://github.com/webdriverio/webdriverio/issues/8979
 */
const jasmineAfterAll = async () => {
    const logFile = path.join(__dirname, 'jasmineAfterAll.spec.log')
    await launch('jasmineAfterAll', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'jasmine', 'afterAll-report.js')],
        reporters: [
            ['spec', {
                outputDir: __dirname,
                stdout: false,
                logFile
            }]
        ],
        framework: 'jasmine'
    }).catch((err) => err) // error expected

    // eslint-disable-next-line no-control-regex
    const specLogs = (await fs.readFile(logFile)).toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')

    assert.ok(
        specLogs.includes('Testing after all hook'),
        'spec did not execute the expected describe'
    )
    assert.ok(
        specLogs.includes('actual expected') && specLogs.includes('truefalse'),
        'spec did not fail with the expected check'
    )
    assert.ok(
        specLogs.includes('✖ Should fail'),
        'spec did not fail on the expected test'
    )
    assert.ok(
        !specLogs.includes('✖ "after all" hook'),
        'spec reported the after all hook as a failed test'
    )
}

/**
 * Jasmine verify failSpecWithNoExpectations support
 */
const jasmineFailSpecWithNoExpectations = async () => {
    const logFile = path.join(__dirname, 'jasmineWithNoExpectations.spec.log')
    await launch('jasmineAfterAll', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'jasmine', 'jasmineWithNoExpectations.js')],
        reporters: [
            ['spec', {
                outputDir: __dirname,
                stdout: false,
                logFile
            }]
        ],
        framework: 'jasmine',
        jasmineOpts: {
            failSpecWithNoExpectations: true
        }
    }).catch((err) => err) // error expected

    // eslint-disable-next-line no-control-regex
    const specLogs = (await fs.readFile(logFile)).toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    assert.ok(
        specLogs.includes('No assertions found in test'),
        'spec did not fail with the expected check'
    )
}

/**
 * Cucumber wdio testrunner tests
 */
const cucumberTestrunner = async () => {
    const { skippedSpecs } = await launch(
        'cucumberTestrunner',
        path.resolve(__dirname, 'helpers', 'cucumber-hooks.conf.js'),
        {
            autoCompileOpts: { autoCompile: false },
            specs: [
                path.resolve(__dirname, 'cucumber', 'test.feature'),
                path.resolve(__dirname, 'cucumber', 'test-skipped.feature')
            ],
            cucumberOpts: {
                tags: '(not @SKIPPED_TAG)',
                ignoreUndefinedDefinitions: true,
                retry: 1,
                retryTagFilter: '@retry',
                scenarioLevelReporter: true
            }
        }
    )
    assert.strictEqual(skippedSpecs, 1)
}

/**
 * Cucumber wdio testrunner -- run single scenario by line number
 */
const cucumberTestrunnerByLineNumber = async () => {
    const logFile = path.join(__dirname, 'cucumber', 'cucumberTestrunnerByLineNumber.log')
    await fs.rm(logFile, { force: true })
    await launch(
        'cucumberTestrunnerByLineNumber',
        path.resolve(__dirname, 'helpers', 'cucumber-hooks.conf.js'),
        {
            autoCompileOpts: { autoCompile: false },
            spec: [path.resolve(__dirname, 'cucumber', 'test.feature:10')],
            cucumberOpts: {
                tags: '(not @SKIPPED_TAG)',
                scenarioLevelReporter: false
            },
            reporters: [
                ['spec', {
                    outputDir: __dirname,
                    stdout: false,
                    logFile
                }]]
        }
    )
    // eslint-disable-next-line no-control-regex
    const specLogs = (await fs.readFile(logFile)).toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    assert.ok(
        specLogs.includes('Sync Execution'),
        'scenario not executed in feature by line number'
    )
    assert.ok(
        !specLogs.includes('Retry Check'),
        'extra scenarios not filtered out by line number'
    )
}

/**
 * Cucumber fail due to failAmbiguousDefinitions
 */
const cucumberFailAmbiguousDefinitions = async () => {
    const hasFailed = await launch(
        'cucumberFailAmbiguousDefinitions',
        path.resolve(__dirname, 'helpers', 'cucumber-hooks.conf.js'),
        {
            autoCompileOpts: { autoCompile: false },
            specs: [path.resolve(__dirname, 'cucumber', 'test.feature')],
            cucumberOpts: {
                ignoreUndefinedDefinitions: true,
                failAmbiguousDefinitions: true,
                name: ['failAmbiguousDefinitions']
            }
        }
    ).then(
        () => false,
        () => true
    )
    assert.equal(hasFailed, true)
}

/**
 * Cucumber reporter
 */
const cucumberReporter = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'reporter')
    await launch(
        'cucumberReporter',
        path.resolve(basePath, 'reporter.config.js'),
        {
            autoCompileOpts: { autoCompile: false },
            specs: [path.resolve(basePath, 'reporter.feature')],
            outputDir: basePath,
        }
    ).catch((err) => err) // error expected
    await sleep(100)
    const reporterLogsPath = path.join(basePath, 'wdio-0-0-smoke-test-reporter.log')
    const reporterLogs = await fs.readFile(reporterLogsPath)
    assert.equal(reporterLogs.toString(), CUCUMBER_REPORTER_LOGS)
    await fs.unlink(reporterLogsPath)
}

/**
 * wdio test run with custom service
 */
const customService = async () => {
    await launch('customService', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'mocha', 'service.js')],
        services: [['smoke-test', { foo: 'bar' }]]
    })
    await sleep(100)
    const serviceLogs = await fs.readFile(path.join(__dirname, 'helpers', 'service.log'))
    assert.equal(serviceLogs.toString(), SERVICE_LOGS)
    const launcherLogs = await fs.readFile(path.join(__dirname, 'helpers', 'launcher.log'))
    assert.equal(launcherLogs.toString(), LAUNCHER_LOGS)
}

/**
 * wdio test run with custom service
 */
const customCJSService = async () => {
    await launch('customCJSService', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'mocha', 'service.js')],
        services: [['smoke-test-cjs', { foo: 'bar' }]]
    })
    await sleep(100)
    const serviceLogs = await fs.readFile(path.join(__dirname, 'helpers', 'service.log'))
    assert.equal(serviceLogs.toString(), SERVICE_LOGS)
    const launcherLogs = await fs.readFile(path.join(__dirname, 'helpers', 'launcher.log'))
    assert.equal(launcherLogs.toString(), LAUNCHER_LOGS)
}

/**
 * wdio test run with custom reporter as string
 */
const customReporterString = async () => {
    await launch('customReporterString', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'mocha', 'reporter.js')],
        reporters: [['smoke-test', { foo: 'bar' }]]
    })
    await sleep(100)
    const reporterLogsPath = path.join(__dirname, 'helpers', 'wdio-0-0-smoke-test-reporter.log')
    const reporterLogs = await fs.readFile(reporterLogsPath)
    assert.equal(reporterLogs.toString(), REPORTER_LOGS)
    await fs.unlink(reporterLogsPath)
}

/**
 * wdio test run with custom reporter as object
 */
const customReporterObject = async () => {
    await launch(
        'customReporterObject',
        path.resolve(__dirname, 'helpers', 'reporter.conf.js'),
        { autoCompileOpts: { autoCompile: false } }
    )
    await sleep(100)
    const reporterLogsWithReporterAsObjectPath = path.join(__dirname, 'helpers', 'wdio-0-0-CustomSmokeTestReporter-reporter.log')
    const reporterLogsWithReporterAsObject = await fs.readFile(reporterLogsWithReporterAsObjectPath)
    assert.equal(reporterLogsWithReporterAsObject.toString(), REPORTER_LOGS)
    await fs.unlink(reporterLogsWithReporterAsObjectPath)
}

/**
 * wdio test run with before/after Test/Hook
 */
const wdioHooks = async () => {
    await launch(
        'wdioHooks',
        path.resolve(__dirname, 'helpers', 'hooks.conf.js'),
        {
            autoCompileOpts: { autoCompile: false },
            specs: [path.resolve(__dirname, 'mocha', 'wdio_hooks.js')]
        }
    )
}

/**
 * multiremote wdio testrunner tests
 */
const multiremote = async () => {
    await launch('multiremote', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'multiremote', 'test.js')],
        capabilities: {
            browserA: {
                capabilities: { browserName: 'chrome' }
            },
            browserB: {
                capabilities: { browserName: 'chrome' }
            }
        }
    })
}

/**
 * parallel multiremote wdio testrunner tests
 */
const parallelMultiremote = async () => {
    console.log(parallelMultiRemoteBaseConfig)
    await launch('parallelMultiremote', parallelMultiRemoteBaseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'multiremote', 'test.js')],
    })
}

/**
 * specfile-level retries (fail)
 */
const retryFail = async () => {
    const retryFailed = await launch('retryFailed', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'mocha', 'retry_and_fail.js')],
        specFileRetries: 1
    }).then(
        () => false,
        () => true
    )
    assert.equal(retryFailed, true, 'Expected retries to fail but they passed')
}

/**
 * specfile-level retries (pass)
 */
const retryPass = async () => {
    const retryFilename = path.join(__dirname, '.retry_succeeded')
    const logfiles = ['wdio-0-0.log', 'wdio-0-1.log'].map(f => path.join(__dirname, f))
    const rmfiles = [retryFilename, ...logfiles]
    for (const filename of rmfiles) {
        if (await fileExists(filename)) {
            fs.unlink(filename, err => {
                if (err) {
                    throw Error(`Unable to delete ${filename}`)
                }
            })
        }
    }
    await launch('retryPass', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'mocha', 'retry_and_pass.js')],
        outputDir: path.dirname(logfiles[0]),
        specFileRetries: 1,
        specFileRetriesDelay: 1,
        retryFilename
    })

    if (!await fileExists(logfiles[0])) {
        throw Error(`Expected ${logfiles[0]} to exist but it does not`)
    }
    if (await fileExists(logfiles[1])) {
        throw Error(`Expected ${logfiles[1]} to not exist but it does`)
    }
}

/**
 * wdio-shared-store-service tests
 */
const sharedStoreServiceTest = async () => {
    /**
     * assertion fails in Windows
     * ToDo(Christian): fix
     */
    if (process.platform === 'win32') {
        return
    }
    await launch(
        'sharedStoreServiceTest',
        path.resolve(__dirname, 'helpers', 'shared-store.conf.js'),
        {
            autoCompileOpts: { autoCompile: false },
            specs: [path.resolve(__dirname, 'mocha', 'shared-store-service.js')]
        }
    )
}

/**
 * Mocha with specFiltering feature enabled
 */
const mochaSpecFiltering = async () => {
    const { skippedSpecs } = await launch('mochaSpecFiltering', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [
            path.resolve(__dirname, 'mocha', 'test-empty.js'),
            path.resolve(__dirname, 'mocha', 'test-skipped.ts'),
            path.resolve(__dirname, 'mocha', 'test-skipped-grep.js')
        ]
    })
    assert.strictEqual(skippedSpecs, 2)
}

/**
 * Jasmine with specFiltering feature enabled
 */
const jasmineSpecFiltering = async () => {
    const { skippedSpecs } = await launch('jasmineSpecFiltering', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [
            path.resolve(__dirname, 'jasmine', 'test-empty.js'),
            path.resolve(__dirname, 'jasmine', 'test-skipped.js'),
            path.resolve(__dirname, 'jasmine', 'test-skipped-grep.js')
        ],
        framework: 'jasmine'
    })
    assert.strictEqual(skippedSpecs, 2)
}

/**
 * Mocha with spec grouping feature enabled
 */
const mochaSpecGrouping = async () => {
    const { skippedSpecs } = await launch('mochaSpecGrouping', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [
            [
                path.resolve(__dirname, 'mocha', 'test-empty.js'),
                path.resolve(__dirname, 'mocha', 'test-middleware.js'),
                path.resolve(__dirname, 'mocha', 'test-waitForElement.js'),
                path.resolve(__dirname, 'mocha', 'test-skipped.js'),
                path.resolve(__dirname, 'mocha', 'test-skipped-grep.js')
            ]
        ]
    })
    // Specs will be treated as a group, so no specs will be skipped
    assert.strictEqual(skippedSpecs, 0)
}

/**
 * Mocha wdio testrunner tests
 */
const standaloneTest = async () => {
    const { skippedSpecs } = await launch(
        'standaloneTest',
        path.resolve(__dirname, 'helpers', 'async.config.js'),
        {
            autoCompileOpts: { autoCompile: false },
            specs: [path.resolve(__dirname, 'mocha', 'standalone.js')]
        }
    )
    assert.strictEqual(skippedSpecs, 0)
}

const severeErrorTest = async () => {
    const onPrepareFailed = await launch('severeErrorTest - onPrepareFailed', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'mocha', 'test-empty.js')],
        onPrepare: () => { throw new SevereServiceError('ups') }
    }).then(() => false, () => true)
    assert.equal(onPrepareFailed, true, 'Expected onPrepare to fail testrun')

    const onWorkerStartFailed = await launch('severeErrorTest - onWorkerStartFailed', baseConfig, {
        specs: [path.resolve(__dirname, 'mocha', 'test-empty.js')],
        onWorkerStart: () => { throw new SevereServiceError('ups') }
    }).then(() => false, () => true)
    assert.equal(onWorkerStartFailed, true, 'Expected onWorkerStart to fail testrun')

    const onWorkerEndFailed = await launch('severeErrorTest - onWorkerEndFailed', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'mocha', 'test-empty.js')],
        onWorkerEnd: () => { throw new SevereServiceError('ups') }
    }).then(() => false, () => true)
    assert.equal(onWorkerEndFailed, true, 'Expected onWorkerStart to fail testrun')

    const onCompleteFailed = await launch('severeErrorTest - onCompleteFailed', baseConfig, {
        autoCompileOpts: { autoCompile: false },
        specs: [path.resolve(__dirname, 'mocha', 'test-empty.js')],
        onComplete: () => { throw new SevereServiceError('ups') }
    }).then(() => false, () => true)
    assert.equal(onCompleteFailed, true, 'Expected onWorkerStart to fail testrun')
}

/**
 * test usage of globals package
 */
const nonGlobalTestrunner = async () => {
    const hasFailed = await launch('nonGlobalTestrunner', baseConfig, {
        specs: [path.resolve(__dirname, 'mocha', 'noGlobals.ts')],
        injectGlobals: false
    }).then(() => false, () => true)
    assert.strictEqual(hasFailed, false)
}

/**
 * Mocha wdio testrunner skip tests via wdio hook
 */
const mochaHooksTestrunner = async () => {
    const { skippedSpecs } = await launch(
        'mochaHooksTestrunner',
        path.resolve(__dirname, 'helpers', 'mocha-hooks.conf.js'),
        {
            specs: [
                path.resolve(__dirname, 'mocha', 'test-skipped-hooks.ts'),
            ]
        }
    )
    assert.strictEqual(skippedSpecs, 0)
}

// ****************************
// *** Tests for CLI --spec ***
// ****************************
const runSpecsWithFlagAllPassed = async () => {
    const { passed, skippedSpecs } = await launch(
        'runSpecsWithFlagAllPassed',
        path.resolve(allPassedConfig),
        {
            autoCompileOpts: { autoCompile: false },
            spec: ['test']
        }
    )
    assert.strictEqual(passed, 4)
    assert.strictEqual(skippedSpecs, 0)
}

const runSpecsWithFlagSeveralPassed = async () => {
    const { passed, skippedSpecs } = await launch(
        'runSpecsWithFlagSeveralPassed',
        path.resolve(severalPassedConfig),
        {
            autoCompileOpts: { autoCompile: false },
            spec: ['mocha']
        }
    )
    assert.strictEqual(passed, 4)
    assert.strictEqual(skippedSpecs, 0)
}

const runSpecsWithFlagDirectPath = async () => {
    const { passed, skippedSpecs } = await launch(
        'runSpecsWithFlagDirectPath',
        path.resolve(severalPassedConfig),
        {
            autoCompileOpts: { autoCompile: false },
            spec: ['./tests/tests-cli-spec-arg/mocha.test03.js']
        }
    )
    assert.strictEqual(passed, 1)
    assert.strictEqual(skippedSpecs, 0)
}

const runSpecsWithFlagNoArg = async () => {
    const { passed, skippedSpecs } = await launch(
        'runSpecsWithFlagNoArg',
        path.resolve(noArgConfig),
        {
            autoCompileOpts: { autoCompile: false },
            spec: []
        }
    )
    assert.strictEqual(passed, 3)
    assert.strictEqual(skippedSpecs, 0)
}

const cliExcludeParamValidationAllExcludedByKeyword = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeParamValidationAllExcluded',
        path.resolve(__dirname, 'tests-cli-exclude-arg/wdio.conf.js'),
        {
            exclude: ['general']
        }
    ).catch((err) => err) // expected error

    assert.strictEqual(passed, undefined)
    assert.strictEqual(skippedSpecs, undefined)
    assert.strictEqual(failed, undefined)
}

const cliExcludeParamValidationSomeExcludedByKeyword = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeParamValidationAllExcluded',
        path.resolve(__dirname, 'tests-cli-exclude-arg/wdio.conf.js'),
        {
            exclude: ['general2']
        }
    )

    assert.strictEqual(passed, 2)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliExcludeParamValidationSomeExcludedByPath = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeParamValidationAllExcluded',
        path.resolve(__dirname, 'tests-cli-exclude-arg/wdio.conf.js'),
        {
            exclude: ['./general.test.js']
        }
    )

    assert.strictEqual(passed, 2)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliExcludeParamValidationExcludeNonExistentByKeyword = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeParamValidationAllExcluded',
        path.resolve(__dirname, 'tests-cli-exclude-arg/wdio.conf.js'),
        {
            exclude: ['newgeneral']
        }
    )

    assert.strictEqual(passed, 3)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliExcludeParamValidationExcludeFromConfigByKeyword = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeParamValidationAllExcluded',
        path.resolve(__dirname, 'tests-cli-exclude-arg/wdio.with-exclude-prop.conf.js')
    )

    assert.strictEqual(passed, 2)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliExcludeParamValidationExcludeMultipleSpecsByPath = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeParamValidationAllExcluded',
        path.resolve(__dirname, 'tests-cli-exclude-arg/wdio.conf.js'),
        {
            exclude: [
                './general.test.js',
                './general2.test.js'
            ]
        }
    )

    assert.strictEqual(passed, 1)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}
// *** END - tests for CLI --spec ***

// *************************
// *** Tests for Jasmine ***
// *************************
const jasmineHooksTestrunner = async () => {
    const logFile = path.join(__dirname, 'jasmineHooksTestrunner.spec.log')
    await launch('jasmineHooksTestrunner',
        path.resolve(__dirname, 'helpers', 'jasmine-hooks.conf.js'),
        {
            autoCompileOpts: { autoCompile: false },
            specs: [path.resolve(__dirname, 'jasmine', 'test-skipped-hooks.ts')],
            reporters: [
                ['spec', {
                    outputDir: __dirname,
                    stdout: false,
                    logFile
                }]
            ],
            framework: 'jasmine',
        }).catch((err) => err) // error expected

    // eslint-disable-next-line no-control-regex
    const specLogs = (await fs.readFile(logFile)).toString().replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '')
    assert.ok(
        specLogs.includes('skip test'),
    )
}

const jasmineAfterHookArgsValidation = async () => {
    const expectedPassedTestResultPath = path.join(__dirname, 'helpers', 'jasmine-after-hook-validation', 'expected-results', 'expectedTestPassed.json')
    const expectedFailedTestResultPath = path.join(__dirname, 'helpers', 'jasmine-after-hook-validation', 'expected-results', 'expectedTestFailed.json')

    // Actual test results are written to files in tests\helpers\jasmine.after-hook-validation.conf.js - afterTest()
    const actualPassedTestResultPath = path.join(__dirname, 'helpers', 'actualResultsPassed.log')
    const actualFailedTestResultPath = path.join(__dirname, 'helpers', 'actualResultsFailed.log')

    await launch('jasmineAfterHookArgsValidation',
        path.resolve(__dirname, 'helpers', 'jasmine.after-hook-validation.conf.js'),
        {
            autoCompileOpts: { autoCompile: false },
            specs: [
                path.resolve(__dirname, 'jasmine', 'test.after-hook-validation.ts')
            ]
        }).catch((err) => err) // error expected

    const actualPassedTestLogs = JSON.parse((await fs.readFile(actualPassedTestResultPath)))
    const actualFailedTestLogs = JSON.parse((await fs.readFile(actualFailedTestResultPath)))
    const expectedPassedTestLogs = JSON.parse((await fs.readFile(expectedPassedTestResultPath)))
    const expectedFailedTestLogs = JSON.parse((await fs.readFile(expectedFailedTestResultPath)))

    // Check before removing
    assert.equal(typeof actualPassedTestLogs.test.start, 'number')
    assert.equal(typeof actualPassedTestLogs.result.start, 'number')
    assert.equal(typeof actualPassedTestLogs.duration, 'number')
    assert.equal(typeof actualFailedTestLogs.test.start, 'number')
    assert.equal(typeof actualFailedTestLogs.duration, 'number')
    assert.equal(typeof actualFailedTestLogs.test.failedExpectations[0].stack, 'string')
    assert.equal(typeof actualFailedTestLogs.result.failedExpectations[0].stack, 'string')
    assert.equal(typeof actualFailedTestLogs.result.start, 'number')
    assert.equal(typeof actualFailedTestLogs.error.stack, 'string')

    // Remove dynamic values that will be different every time you run tests, e.g. start time or filepaths
    delete actualPassedTestLogs.test.start
    delete actualPassedTestLogs.test.filename
    delete actualPassedTestLogs.result.start
    delete actualPassedTestLogs.result.filename
    delete actualPassedTestLogs.duration
    delete actualFailedTestLogs.test.start
    delete actualFailedTestLogs.test.filename
    delete actualFailedTestLogs.test.failedExpectations[0].stack
    delete actualFailedTestLogs.error.stack
    delete actualFailedTestLogs.result.start
    delete actualFailedTestLogs.result.filename
    delete actualFailedTestLogs.result.failedExpectations[0].stack
    delete actualFailedTestLogs.duration

    assert.deepStrictEqual(actualPassedTestLogs, expectedPassedTestLogs)
    assert.deepStrictEqual(actualFailedTestLogs, expectedFailedTestLogs)
}
// *** END - Tests for Jasmine ***

(async () => {
    const smokeTests = [
        mochaTestrunner,
        jasmineTestrunner,
        multiremote,
        parallelMultiremote,
        wdioHooks,
        cjsTestrunner,
        sharedStoreServiceTest,
        mochaSpecGrouping,
        cucumberTestrunner,
        cucumberTestrunnerByLineNumber,
        cucumberFailAmbiguousDefinitions,
        cucumberReporter,
        standaloneTest,
        mochaAsyncTestrunner,
        customService,
        customCJSService,
        mochaSpecFiltering,
        jasmineSpecFiltering,
        jasmineReporter,
        jasmineTimeout,
        jasmineAfterAll,
        jasmineFailSpecWithNoExpectations,
        retryFail,
        retryPass,
        customReporterString,
        customReporterObject,
        severeErrorTest,
        nonGlobalTestrunner,
        mochaHooksTestrunner,
        runSpecsWithFlagAllPassed,
        runSpecsWithFlagSeveralPassed,
        runSpecsWithFlagDirectPath,
        runSpecsWithFlagNoArg,
        jasmineHooksTestrunner,
        jasmineAfterHookArgsValidation,
        cliExcludeParamValidationAllExcludedByKeyword,
        cliExcludeParamValidationSomeExcludedByKeyword,
        cliExcludeParamValidationSomeExcludedByPath,
        cliExcludeParamValidationExcludeNonExistentByKeyword,
        cliExcludeParamValidationExcludeFromConfigByKeyword,
        cliExcludeParamValidationExcludeMultipleSpecsByPath
    ]

    console.log('\nRunning smoke tests...\n')
    await runTests(smokeTests)

    console.log('\nAll smoke tests passed!\n')
    process.exit(0)
})().catch((e) => {
    // eslint-disable-next-line no-console
    console.log(e.stack)

    process.exit(1)
})
