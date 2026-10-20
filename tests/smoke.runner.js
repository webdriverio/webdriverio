import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import url from 'node:url'
import path from 'node:path'
import os from 'node:os'
import assert from 'node:assert'
import { expect } from 'expect-webdriverio'

import { SevereServiceError } from 'webdriverio'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const baseConfig = path.resolve(__dirname, 'helpers', 'config.js')
const parallelMultiRemoteBaseConfig = path.resolve(__dirname, 'helpers', 'parallel-multiremote-config.js')
const jasmineConfig = path.resolve(__dirname, 'helpers', 'configJasmine.js')
const allPassedConfig = path.resolve(__dirname, 'tests-cli-spec-arg/wdio-with-all-passed.conf.js')
const noArgConfig = path.resolve(__dirname, 'tests-cli-spec-arg/wdio-with-no-arg.conf.js')
const severalPassedConfig = path.resolve(__dirname, 'tests-cli-spec-arg/wdio-with-failed.conf.js')
const allPassedWildCardConfig = path.resolve(__dirname, 'tests-cli-spec-arg/wdio-with-all-passed-wildcard.conf.js')

// eslint-disable-next-line no-control-regex
const ansiColorRegex = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g

process.env.WDIO_UNIT_TESTS = '1'

import launch from './helpers/launch.js'
import { headlessCapsLog } from './helpers/headless.conf.js'
import watchMode from './watch-mode/spec-change/run.js'
import watchFilesToWatch from './watch-mode/files-to-watch/run.js'
import {
    SERVICE_LOGS,
    LAUNCHER_LOGS,
    REPORTER_LOGS,
    JASMINE_REPORTER_LOGS,
    CUCUMBER_REPORTER_LOGS,
} from './helpers/fixtures.js'

export const sleep = (ms = 0) => new Promise((r) => setTimeout(r, ms))

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
    const { skippedSpecs, passed } = await launch('mochaTestrunner', baseConfig, {
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
    assert.strictEqual(passed, 4)
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
            spec: ['./mocha/test-async.ts']
        }
    )
    assert.strictEqual(skippedSpecs, 0)
}

/**
 * Test if you can run CJS tests
 */
const cjsTestrunner = async () => {
    const { skippedSpecs } = await launch('cjsTestrunner', baseConfig, {
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
    expect((await fs.readFile(logFile, 'utf-8')).toString()).toBe(
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
            'expect(object).toBeUndefined(undefined)',
            'expect(object).toHaveBeenCalled(function)',
            'expect(number).toHaveSize(object)',
            'expect(object).toBeUndefined(undefined)',
            'expect(number).toBe(number)',
            'expect(object).toBeDefined(function)',
            'expect(function).toBeInstanceOf(function)',
            'expect(object).testMatcher(number)',
            'expect(object).toBeUndefined(undefined)',
            'expect(string).toMatchInlineSnapshot(object)',
            ''
        ].join('\n')
    )
}

/**
 * Jasmine: a matcher added with `expect.extend()` in the `before` hook
 */
const jasmineCustomMatcher = async () => {
    await launch('jasmineCustomMatcher', path.resolve(__dirname, 'helpers', 'jasmine-custom-matcher.conf.js'), {
        specs: [path.resolve(__dirname, 'jasmine', 'custom-matcher.js')]
    })
}

/**
 * Jasmine: `expect.multiRemote()` on the global `expect` and on the one of `@wdio/globals`
 */
const jasmineMultiRemote = async () => {
    await launch('jasmineMultiRemote', baseConfig, {
        specs: [path.resolve(__dirname, 'jasmine', 'multi-remote.js')],
        framework: 'jasmine',
        capabilities: {
            browserA: { capabilities: { browserName: 'chrome' } },
            browserB: { capabilities: { browserName: 'chrome' } }
        }
    })
}

/**
 * Jasmine reporter
 */
const jasmineReporter = async () => {
    await launch('jasmineReporter', baseConfig, {
        specs: [path.resolve(__dirname, 'jasmine', 'reporter.js')],
        reporters: [['smoke-test', { foo: 'bar' }]],
        framework: 'jasmine',
        outputDir: __dirname + '/jasmine'
    }).catch((err) => err) // error expected
    await sleep(100)
    const reporterLogsPath = path.resolve(__dirname, 'jasmine', 'wdio-0-0-smoke-test-reporter.log')
    const reporterLogs = await fs.readFile(reporterLogsPath)
    expect(reporterLogs.toString()).toEqual(JASMINE_REPORTER_LOGS)
    await fs.unlink(reporterLogsPath)
}

/**
 * Jasmine timeout test
 */
const jasmineTimeout = async () => {
    const logFile = path.resolve(__dirname, 'jasmineTimeout.spec.log')
    await launch('jasmineTimeout', baseConfig, {
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

    const specLogs = (await fs.readFile(logFile)).toString().replace(ansiColorRegex, '')
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
 * Mocha timeout error names the WebdriverIO attempt of a retried test
 * https://github.com/webdriverio/webdriverio/issues/16121
 */
const mochaTimeout = async () => {
    const logFile = path.resolve(__dirname, 'mochaTimeout.spec.log')
    await launch('mochaTimeout', baseConfig, {
        specs: [path.resolve(__dirname, 'mocha', 'timeout.js')],
        mochaOpts: { ui: 'bdd', timeout: 1000 },
        reporters: [
            ['spec', {
                outputDir: __dirname,
                stdout: false,
                logFile
            }]
        ]
    }).catch((err) => err) // error expected

    const errors = (await fs.readFile(logFile)).toString().replace(ansiColorRegex, '')
        .split('\n')
        .filter((line) => line.includes('Error: Timeout of 1000ms exceeded.'))
    await fs.unlink(logFile)
    assert.strictEqual(errors.length, 2, `expected 2 timeout errors, got:\n${errors.join('\n')}`)
    assert.ok(
        errors.some((line) => line.includes('"Mocha timeout times out without retries"') && !line.includes('WDIO attempt')),
        'a timeout without retries should keep the Mocha error'
    )
    assert.ok(
        errors.some((line) => line.includes('"Mocha timeout times out in the 2nd attempt"') && line.endsWith(' (WDIO attempt 2/2)')),
        'a timeout of a retried test should name the WDIO attempt'
    )
}

/**
 * Jasmine afterAll is wrongly reported as a failing test - issue #8979
 * https://github.com/webdriverio/webdriverio/issues/8979
 */
const jasmineAfterAll = async () => {
    const logFile = path.resolve(__dirname, 'jasmineAfterAll.spec.log')
    await launch('jasmineAfterAll', baseConfig, {
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

    const specLogs = (await fs.readFile(logFile)).toString().replace(ansiColorRegex, '')

    assert.ok(
        specLogs.includes('Testing after all hook'),
        'spec did not execute the expected describe'
    )
    assert.ok(
        specLogs.includes('Expected true to be false.'),
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
    const logFile = path.resolve(__dirname, 'jasmineWithNoExpectations.spec.log')
    await launch('jasmineAfterAll', baseConfig, {
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

    const specLogs = (await fs.readFile(logFile)).toString().replace(ansiColorRegex, '')
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
    const logFile = path.resolve(__dirname, 'cucumber', 'cucumberTestrunnerByLineNumber.log')
    await fs.rm(logFile, { force: true })
    await launch(
        'cucumberTestrunnerByLineNumber',
        path.resolve(__dirname, 'helpers', 'cucumber-hooks.conf.js'),
        {
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
    const specLogs = (await fs.readFile(logFile)).toString().replace(ansiColorRegex, '')
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
 * Cucumber wdio testrunner -- run three features (by line number) and verify each only runs once
 */
const cucumberTestrunnerMultipleByLineNumber = async () => {
    const featureDir = path.resolve(__dirname, 'cucumber', 'features')
    const { failed, passed, skippedSpecs } = await launch(
        'cucumberTestrunnerMultipleByLineNumber',
        path.resolve(__dirname, 'helpers', 'cucumber-features.conf.js'),
        {
            spec: [
                path.resolve(featureDir, 'test1.feature:4'),
                // deliberately w/o line number to capture more potential bugs
                path.resolve(featureDir, 'test2.feature'),
                path.resolve(featureDir, 'test3.feature:4'),
            ],
            reporters: [
                ['spec', {
                    outputDir: __dirname,
                    stdout: false,
                }]]
        }
    )
    assert.strictEqual(failed, 0)
    assert.strictEqual(passed, 3)
    assert.strictEqual(skippedSpecs, 0)
}

/**
 * Cucumber fail due to failAmbiguousDefinitions
 */
const cucumberFailAmbiguousDefinitions = async () => {
    const logFile = path.resolve(__dirname, 'cucumber', 'cucumberAmbiguousDefinitions.log')
    const run = async (cucumberOpts) => {
        await fs.rm(logFile, { force: true })
        try {
            const hasFailed = await launch(
                'cucumberFailAmbiguousDefinitions',
                path.resolve(__dirname, 'helpers', 'cucumber-hooks.conf.js'),
                {
                    specs: [path.resolve(__dirname, 'cucumber', 'test.feature')],
                    reporters: [['spec', { stdout: false, logFile }]],
                    cucumberOpts: { ...cucumberOpts, name: ['failAmbiguousDefinitions'] }
                }
            ).then(
                () => false,
                () => true
            )
            assert.equal(hasFailed, true)
            return (await fs.readFile(logFile, 'utf-8')).replace(ansiColorRegex, '')
        } finally {
            await fs.rm(logFile, { force: true })
        }
    }

    // Cucumber writes the step definition files with the path separator of the OS
    const definitionLine = (file, line) => new RegExp(
        `this is ambiguous - \\S*${path.join('step-definitions', file).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:${line}`
    )

    const failLogs = await run({ ignoreUndefinedDefinitions: true, failAmbiguousDefinitions: true })
    assert.match(failLogs, /Multiple step definitions match:/)
    assert.match(failLogs, definitionLine('given.js', 89))
    assert.match(failLogs, definitionLine('then.js', 20))
    assert.match(failLogs, /at Step\(this is ambiguous\):50:9/)

    // default: the step is skipped, with the definitions as its reason
    const skipLogs = await run({ failAmbiguousDefinitions: false })
    assert.match(skipLogs, /Pending Reasons[\s\S]*Multiple step definitions match:/)
    assert.match(skipLogs, definitionLine('given.js', 89))
    assert.match(skipLogs, definitionLine('then.js', 20))
}

/**
 * Cucumber pending status test
 */
const cucumberPendingTest = async () => {
    const logFile = path.resolve(__dirname, 'cucumber', 'cucumberPendingTest.log')
    await fs.rm(logFile, { force: true })

    await launch(
        'cucumberPendingTest',
        path.resolve(__dirname, 'helpers', 'cucumber-hooks.conf.js'),
        {
            specs: [
                path.resolve(__dirname, 'cucumber', 'test-pending.feature')
            ],
            reporters: [
                ['spec', {
                    outputDir: __dirname,
                    stdout: false,
                    logFile
                }]
            ],
            cucumberOpts: {
                ignoreUndefinedDefinitions: true,
                scenarioLevelReporter: true
            }
        }
    )

    const specLogs = (await fs.readFile(logFile)).toString().replace(ansiColorRegex, '')
    const pendingMatch = specLogs.match(/(\d+)\s+pending/)
    assert.ok(
        pendingMatch && parseInt(pendingMatch[1], 10) === 1,
        'Expected exactly 1 pending test in output'
    )
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
 * Cucumber with grouped specs in a random order: the scenarios of 2 features mix,
 * and the reporters must still get each scenario
 */
const cucumberGroupedSpecsRandomOrder = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'random-order')
    const scenarios = ['a one', 'a two', 'a three', 'b one', 'b two', 'b three']
    // the scenarios are suites (step level) or tests (scenarioLevelReporter)
    for (const scenarioLevelReporter of [false, true]) {
        const logFile = path.resolve(basePath, `spec-reporter-${scenarioLevelReporter}.log`)
        await fs.rm(logFile, { force: true })
        await launch(
            'cucumberGroupedSpecsRandomOrder',
            path.resolve(basePath, 'random-order.conf.js'),
            {
                reporters: [['spec', { stdout: false, logFile }]],
                cucumberOpts: { scenarioLevelReporter }
            }
        )
        // the spec reporter colors its output when the terminal supports colors
        const logs = (await fs.readFile(logFile, 'utf-8')).replace(ansiColorRegex, '')
        assert.ok(logs.includes('6 passing'), `the spec reporter does not count the 6 scenarios:\n${logs}`)
        /**
         * each scenario under the heading of its feature: a scenario is a suite title
         * (step level) or a passed test (`✓ a one`, scenario level)
         */
        const headings = []
        const listed = []
        for (const line of logs.split('\n').map((text) => text.replace(/^\[[^\]]*\]\s*/, '').trim())) {
            const feature = line.match(/^Feature ([ab])$/)
            const scenario = line.replace(/^✓ /, '')
            if (feature) {
                headings.push(feature[1])
            } else if (scenarios.includes(scenario)) {
                listed.push(`${headings.at(-1)}: ${scenario}`)
            }
        }
        assert.deepStrictEqual(
            [...listed].sort(),
            scenarios.map((scenario) => `${scenario[0]}: ${scenario}`).sort(),
            `scenarioLevelReporter: ${scenarioLevelReporter}, each scenario must be under its feature:\n${logs}`
        )
        // the test needs the features to alternate (a, b, a, ...), as the random order gives them
        assert.ok(headings.length > 2, `the scenarios of the features did not mix, the test checks nothing: ${headings}`)
        await fs.rm(logFile, { force: true })
    }
}

/**
 * Cucumber with grouped specs in a random order and scenario-level tests: a scenario
 * keeps its Allure `historyId` when the random order splits its feature into parts
 */
const cucumberGroupedSpecsRandomOrderHistory = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'random-order')
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-random-order-history-'))
    const historyIds = {}
    let passed = false
    try {
        for (const order of ['random:42', 'defined']) {
            const name = order.replace(':', '-')
            const outputDir = path.join(tmpDir, `allure-${name}`)
            const logFile = path.join(tmpDir, `spec-${name}.log`)
            await launch(
                'cucumberGroupedSpecsRandomOrderHistory',
                path.resolve(basePath, 'random-order.conf.js'),
                {
                    reporters: [
                        ['allure', { outputDir, disableWebdriverStepsReporting: true, disableWebdriverScreenshotsReporting: true }],
                        ['spec', { stdout: false, logFile }]
                    ],
                    cucumberOpts: { scenarioLevelReporter: true, order }
                }
            )
            const results = (await fs.readdir(outputDir)).filter((file) => file.endsWith('-result.json'))
            historyIds[order] = {}
            for (const file of results) {
                const { name: scenario, historyId } = JSON.parse(await fs.readFile(path.join(outputDir, file), 'utf-8'))
                assert.ok(typeof historyId === 'string' && historyId.length > 0, `Missing Allure historyId for ${scenario} in ${order}`)
                historyIds[order][scenario] = historyId
            }
            if (order !== 'defined') {
                // the test needs the features to alternate (a, b, a, ...), so that a feature has a second part
                const headings = (await fs.readFile(logFile, 'utf-8')).replace(ansiColorRegex, '').split('\n')
                    .filter((line) => /^Feature [ab]$/.test(line.replace(/^\[[^\]]*\]\s*/, '').trim()))
                assert.ok(headings.length > 2, `the scenarios of the features did not mix in order ${order}, the test checks nothing`)
            }
        }
        assert.equal(Object.keys(historyIds.defined).length, 6, `Allure did not get the 6 scenarios: ${JSON.stringify(historyIds)}`)
        assert.equal(new Set(Object.values(historyIds.defined)).size, 6, `each scenario must have its own historyId: ${JSON.stringify(historyIds)}`)
        assert.deepStrictEqual(historyIds['random:42'], historyIds.defined, 'a scenario must keep its historyId in a random order')
        passed = true
    } finally {
        // keep the Allure results of a failed run to examine them
        if (passed) {
            await fs.rm(tmpDir, { recursive: true, force: true })
        } else {
            console.error(`cucumberGroupedSpecsRandomOrderHistory: Allure and spec output kept in ${tmpDir}`)
        }
    }
}

/**
 * Cucumber with 2 feature files with the same file name in other folders: each feature
 * keeps its suite and its scenarios, and each scenario has its own Allure historyId,
 * the same in grouped and not grouped specs
 */
const cucumberSameFeatureFileName = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'same-file-name')
    const configFile = path.resolve(basePath, 'same-file-name.conf.js')
    const files = [path.join(basePath, 'admin', 'login.feature'), path.join(basePath, 'user', 'login.feature')]
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wdio-same-feature-file-name-'))
    let passed = false
    try {
        const logFile = path.join(tmpDir, 'spec.log')
        await launch('cucumberSameFeatureFileName', configFile, { reporters: [['spec', { stdout: false, logFile }]] })
        const logs = (await fs.readFile(logFile, 'utf-8')).replace(ansiColorRegex, '')
        const listed = []
        let heading
        for (const line of logs.split('\n').map((text) => text.replace(/^\[[^\]]*\]\s*/, '').trim())) {
            if (['Admin login', 'User login'].includes(line)) {
                heading = line
            } else if (['logs in', 'logs out'].includes(line)) {
                listed.push(`${heading}: ${line}`)
            }
        }
        assert.deepStrictEqual(listed, ['Admin login: logs in', 'Admin login: logs out', 'User login: logs in'],
            `each scenario must be under the heading of its feature:\n${logs}`)

        const historyIds = {}
        for (const [name, specs] of [['notGrouped', files], ['grouped', [files]]]) {
            const outputDir = path.join(tmpDir, `allure-${name}`)
            await launch('cucumberSameFeatureFileName', configFile, {
                specs,
                reporters: [['allure', { outputDir, disableWebdriverStepsReporting: true, disableWebdriverScreenshotsReporting: true }]],
                cucumberOpts: { scenarioLevelReporter: true }
            })
            historyIds[name] = {}
            for (const file of (await fs.readdir(outputDir)).filter((f) => f.endsWith('-result.json'))) {
                const result = JSON.parse(await fs.readFile(path.join(outputDir, file), 'utf-8'))
                const feature = result.labels.find((label) => label.name === 'feature')?.value
                historyIds[name][`${feature}: ${result.name}`] = result.historyId
            }
        }
        assert.equal(new Set(Object.values(historyIds.notGrouped)).size, 3, `each scenario must have its own historyId: ${JSON.stringify(historyIds)}`)
        assert.deepStrictEqual(historyIds.grouped, historyIds.notGrouped, 'a scenario must keep its historyId when its spec is grouped')
        passed = true
    } finally {
        // keep the output of a failed run to examine it
        if (passed) {
            await fs.rm(tmpDir, { recursive: true, force: true })
        } else {
            console.error(`cucumberSameFeatureFileName: output kept in ${tmpDir}`)
        }
    }
}

/**
 * The JSON folder of a Cucumber JSON suite: each suite has its own, because an
 * unfiltered local run starts the suites at the same time
 */
const cucumberJsJsonFolder = (suite) => path.resolve(__dirname, 'cucumber', 'cucumberjs-json', 'json', suite)

/**
 * Cucumber with @wdio/cucumberjs-json-reporter: writes one JSON file per feature,
 * with the attachments that the steps send with `attach()`
 */
const cucumberJsJsonReporter = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'cucumberjs-json')
    const jsonFolder = cucumberJsJsonFolder('cucumberJsJsonReporter')
    await fs.rm(jsonFolder, { recursive: true, force: true })
    await launch(
        'cucumberJsJsonReporter',
        path.resolve(basePath, 'cucumberjs-json.config.js'),
        {
            specs: [path.resolve(basePath, 'cucumberjs-json.feature')],
            reporters: [['cucumberjs-json', { jsonFolder }]]
        }
    )
    const files = await fs.readdir(jsonFolder)
    assert.equal(files.length, 1)
    const [feature] = JSON.parse(await fs.readFile(path.join(jsonFolder, files[0]), 'utf-8'))
    assert.equal(feature.name, 'CucumberJS JSON report')
    assert.equal(feature.elements.length, 1)
    const steps = feature.elements[0].steps.filter((step) => !['Before', 'After'].includes(step.keyword))
    assert.deepEqual(
        steps.map((step) => [step.keyword, step.name, step.result.status]),
        [
            ['Given', 'I attach the text "hello"', 'passed'],
            ['And', 'I attach the JSON value "world"', 'passed'],
            ['Then', 'the page title is "Mock Page Title"', 'passed']
        ]
    )
    assert.deepEqual(steps[0].embeddings, [{ data: Buffer.from('hello').toString('base64'), mime_type: 'text/plain' }])
    // line numbers and ids as the Cucumber JSON format has them
    assert.equal(feature.elements[0].id, 'cucumberjs-json-report;attach-data-to-the-steps')
    assert.equal(feature.elements[0].line, 2)
    assert.deepEqual(steps.map((step) => step.line), [3, 4, 5])
    assert.ok(feature.elements[0].steps.filter((step) => ['Before', 'After'].includes(step.keyword)).every((hook) => hook.hidden === true))
    assert.deepEqual(steps[1].embeddings, [{ data: Buffer.from('{"value":"world"}').toString('base64'), mime_type: 'application/json' }])
    await fs.rm(jsonFolder, { recursive: true, force: true })
}

/**
 * Cucumber with @wdio/cucumberjs-json-reporter and 2 features in one worker: one
 * JSON file for each feature
 */
const cucumberJsJsonReporterGroupedSpecs = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'cucumberjs-json')
    const jsonFolder = cucumberJsJsonFolder('cucumberJsJsonReporterGroupedSpecs')
    await fs.rm(jsonFolder, { recursive: true, force: true })
    await launch(
        'cucumberJsJsonReporterGroupedSpecs',
        path.resolve(basePath, 'cucumberjs-json.config.js'),
        {
            specs: [[
                path.resolve(basePath, 'cucumberjs-json.feature'),
                path.resolve(basePath, 'cucumberjs-json-second.feature')
            ]],
            reporters: [['cucumberjs-json', { jsonFolder }]]
        }
    )
    const features = []
    for (const file of await fs.readdir(jsonFolder)) {
        features.push(...JSON.parse(await fs.readFile(path.join(jsonFolder, file), 'utf-8')))
    }
    assert.deepEqual(
        features.map((feature) => [feature.name, feature.elements.map((scenario) => scenario.name)]).sort(),
        [
            ['CucumberJS JSON report', ['Attach data to the steps']],
            ['Second feature', ['Check the title']]
        ]
    )
    await fs.rm(jsonFolder, { recursive: true, force: true })
}

/**
 * Cucumber with @wdio/cucumberjs-json-reporter in a multi-remote session: the
 * metadata comes from the first instance
 */
const cucumberJsJsonReporterMultiRemote = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'cucumberjs-json')
    const jsonFolder = cucumberJsJsonFolder('cucumberJsJsonReporterMultiRemote')
    await fs.rm(jsonFolder, { recursive: true, force: true })
    await launch(
        'cucumberJsJsonReporterMultiRemote',
        path.resolve(basePath, 'cucumberjs-json.multiremote.config.js'),
        {
            specs: [path.resolve(basePath, 'cucumberjs-json.feature')],
            reporters: [['cucumberjs-json', { jsonFolder }]]
        }
    )
    const files = await fs.readdir(jsonFolder)
    assert.equal(files.length, 1)
    const [feature] = JSON.parse(await fs.readFile(path.join(jsonFolder, files[0]), 'utf-8'))
    assert.equal(feature.metadata.device, 'Device A')
    assert.notEqual(feature.metadata.browser.name, 'No metadata.browser.name available')
    await fs.rm(jsonFolder, { recursive: true, force: true })
}

/**
 * Cucumber with @wdio/cucumberjs-json-reporter: the keywords of a feature file with a
 * `# language:` header, and the `undefined` status of a step with no definition
 */
const cucumberJsJsonReporterLanguageAndUndefined = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'cucumberjs-json')
    const jsonFolder = cucumberJsJsonFolder('cucumberJsJsonReporterLanguageAndUndefined')
    await fs.rm(jsonFolder, { recursive: true, force: true })
    await launch(
        'cucumberJsJsonReporterLanguageAndUndefined',
        path.resolve(basePath, 'cucumberjs-json.undefined.config.js'),
        {
            specs: [path.resolve(basePath, 'cucumberjs-json.fr.feature')],
            reporters: [['cucumberjs-json', { jsonFolder }]]
        }
    )
    const files = await fs.readdir(jsonFolder)
    assert.equal(files.length, 1)
    const [feature] = JSON.parse(await fs.readFile(path.join(jsonFolder, files[0]), 'utf-8'))
    const steps = feature.elements[0].steps.filter((step) => !step.hidden)
    assert.deepEqual(
        steps.map((step) => [step.keyword, step.name, step.line, step.result.status]),
        [
            ['Soit', 'je passe', 4, 'passed'],
            ['Alors', 'une étape sans définition', 5, 'undefined']
        ]
    )
    // the last hook comes after the steps
    assert.equal(feature.elements[0].steps.at(-1).keyword, 'After')
    await fs.rm(jsonFolder, { recursive: true, force: true })
}

/**
 * Cucumber with @wdio/cucumberjs-json-reporter: the status of an ambiguous step, with its
 * step definitions (the text of @wdio/cucumber-framework that the reporter reads)
 */
const cucumberJsJsonReporterAmbiguous = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'cucumberjs-json')
    const jsonFolder = cucumberJsJsonFolder('cucumberJsJsonReporterAmbiguous')
    for (const configFile of ['cucumberjs-json.config.js', 'cucumberjs-json.ambiguous-fail.config.js']) {
        await fs.rm(jsonFolder, { recursive: true, force: true })
        await launch(
            'cucumberJsJsonReporterAmbiguous',
            path.resolve(basePath, configFile),
            {
                specs: [path.resolve(basePath, 'cucumberjs-json.ambiguous.feature')],
                reporters: [['cucumberjs-json', { jsonFolder }]]
            }
        ).catch((err) => err) // error expected: Cucumber fails a run with an ambiguous step
        const files = await fs.readdir(jsonFolder)
        assert.equal(files.length, 1, configFile)
        const [feature] = JSON.parse(await fs.readFile(path.join(jsonFolder, files[0]), 'utf-8'))
        const step = feature.elements[0].steps.filter((s) => !s.hidden)[1]
        assert.equal(step.result.status, 'ambiguous', configFile)
        assert.match(step.result.error_message, /^Multiple step definitions match:\n  I am ambiguous - .*cucumberjs-json\.steps\.js:\d+\n  \/\^I am ambig\/ - .*cucumberjs-json\.steps\.js:\d+/, configFile)
    }
    await fs.rm(jsonFolder, { recursive: true, force: true })
}

/**
 * Cucumber with @wdio/cucumberjs-json-reporter: the status of a hook that Cucumber skips,
 * as cucumber-js writes it (a hook after a failed hook, a hook that returns 'skipped')
 */
const cucumberJsJsonReporterHookStatus = async () => {
    const basePath = path.resolve(__dirname, 'cucumber', 'cucumberjs-json')
    const jsonFolder = cucumberJsJsonFolder('cucumberJsJsonReporterHookStatus')
    await fs.rm(jsonFolder, { recursive: true, force: true })
    await launch(
        'cucumberJsJsonReporterHookStatus',
        path.resolve(basePath, 'cucumberjs-json.config.js'),
        {
            specs: [path.resolve(basePath, 'cucumberjs-json.hooks.feature')],
            reporters: [['cucumberjs-json', { jsonFolder }]]
        }
    ).catch((err) => err) // error expected: a hook fails
    const files = await fs.readdir(jsonFolder)
    assert.equal(files.length, 1)
    const [feature] = JSON.parse(await fs.readFile(path.join(jsonFolder, files[0]), 'utf-8'))
    assert.deepEqual(
        feature.elements.map((scenario) => [scenario.name, scenario.steps.map((step) => `${step.keyword} ${step.result.status}`)]),
        [
            // the first Before and the After are the hooks of WebdriverIO
            ['A Before hook returns skipped', ['Before passed', 'Before skipped', 'Given skipped', 'After passed']],
            ['A Before hook fails', ['Before passed', 'Before failed', 'Before skipped', 'Given skipped', 'After passed']]
        ]
    )
    // tags as in the Cucumber JSON format: name and line
    assert.deepEqual(feature.tags, [{ name: '@hooks', line: 1 }])
    assert.deepEqual(feature.elements.map((scenario) => scenario.tags), [
        [{ name: '@hooks', line: 1 }, { name: '@hookSkips', line: 3 }],
        [{ name: '@hooks', line: 1 }, { name: '@hookFails', line: 7 }]
    ])
    await fs.rm(jsonFolder, { recursive: true, force: true })
}

/**
 * Cucumber file option
 */
const cucumberFileOption = async () => {
    const logFile = path.resolve(__dirname, 'cucumber', 'cucumberFileOption.log')
    await fs.rm(logFile, { force: true })
    const { passed } = await launch(
        'cucumberFileOption',
        path.resolve(__dirname, 'helpers', 'cucumber-hooks.conf.js'),
        {
            specs: [
                path.resolve(__dirname, 'cucumber', 'test.feature'),
            ],
            reporters: [
                ['spec', {
                    outputDir: __dirname,
                    stdout: false,
                    logFile
                }]],
            cucumberOpts: {
                ignoreUndefinedDefinitions: true,
                scenarioLevelReporter: true,
                retry: 1,
                retryTagFilter: '@retry',
                file: './cucumber/cucumber.js'
            }
        }
    )
    assert.strictEqual(passed, 1)
    const specLogs = (await fs.readFile(logFile)).toString().replace(ansiColorRegex, '')
    assert.ok(
        specLogs.includes('test-skipped.feature'),
        'scenario not included according to cucumber config'
    )
}

/**
 * Cucumber @skip() tag
 */
const cucumberSkipTag = async () => {
    for (const capability of [
        { browserName: 'chrome' },
        { browserName: 'firefox' },
        { browserName: 'edge', platformName: 'windows 10' },
        { browserName: 'edge', platformName: 'MacOS' }
    ]) {
        const { skippedSpecs } = await launch(
            'cucumberSkipTag',
            path.resolve(__dirname, 'helpers', 'cucumber-hooks.conf.js'),
            {
                capabilities: [capability],
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
}

/**
 * wdio test run with custom service
 */
const customService = async () => {
    await launch('customService', baseConfig, {
        specs: [path.resolve(__dirname, 'mocha', 'service.js')],
        services: [['smoke-test', { foo: 'bar' }]]
    })
    await sleep(100)
    const serviceLogs = await fs.readFile(path.resolve(__dirname, 'helpers', 'service.log'))
    assert.equal(serviceLogs.toString(), SERVICE_LOGS)
    const launcherLogs = await fs.readFile(path.resolve(__dirname, 'helpers', 'launcher.log'))
    assert.equal(launcherLogs.toString(), LAUNCHER_LOGS)
}

/**
 * wdio test run with custom service
 */
const customCJSService = async () => {
    await launch('customCJSService', baseConfig, {
        specs: [path.resolve(__dirname, 'mocha', 'service.js')],
        services: [['smoke-test-cjs', { foo: 'bar' }]]
    })
    await sleep(100)
    const serviceLogs = await fs.readFile(path.resolve(__dirname, 'helpers', 'service.log'))
    assert.equal(serviceLogs.toString(), SERVICE_LOGS)
    const launcherLogs = await fs.readFile(path.resolve(__dirname, 'helpers', 'launcher.log'))
    assert.equal(launcherLogs.toString(), LAUNCHER_LOGS)
}

/**
 * wdio test run with custom reporter as string
 */
const customReporterString = async () => {
    await launch('customReporterString', baseConfig, {
        specs: [path.resolve(__dirname, 'mocha', 'reporter.js')],
        reporters: [['smoke-test', { foo: 'bar' }]]
    })
    await sleep(100)
    const reporterLogsPath = path.resolve(__dirname, 'helpers', 'wdio-0-0-smoke-test-reporter.log')
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
    )
    await sleep(100)
    const reporterLogsWithReporterAsObjectPath = path.resolve(__dirname, 'helpers', 'wdio-0-0-CustomSmokeTestReporter-reporter.log')
    const reporterLogsWithReporterAsObject = await fs.readFile(reporterLogsWithReporterAsObjectPath)
    assert.equal(reporterLogsWithReporterAsObject.toString(), REPORTER_LOGS)
    await fs.unlink(reporterLogsWithReporterAsObjectPath)
}

/**
 * The session is already gone when the run ends (#13114, #9436): `deleteSession`
 * fails, but the worker still ends cleanly and the reporters get `runner:end`.
 */
const sessionGoneReport = async () => {
    const outputDir = path.resolve(__dirname, 'helpers', 'session-gone')
    await fs.rm(outputDir, { recursive: true, force: true })
    const { passed, failed } = await launch('sessionGoneReport', baseConfig, {
        specs: [path.resolve(__dirname, 'mocha', 'session_gone.js')],
        reporters: [['smoke-test', { outputDir }]]
    })
    assert.strictEqual(passed, 1)
    assert.strictEqual(failed, 0)
    await sleep(100)
    const reporterLogs = (await fs.readFile(path.join(outputDir, 'wdio-0-0-smoke-test-reporter.log'))).toString()
    await fs.rm(outputDir, { recursive: true, force: true })
    assert.ok(reporterLogs.trim().endsWith('onRunnerEnd'), `expected the report to end with onRunnerEnd, got:\n${reporterLogs}`)
}

/**
 * The command hooks run once for each command of an element, not two or three times
 * (#16086 item 36)
 */
const commandHookCounts = async () => {
    const { passed, failed } = await launch(
        'commandHookCounts',
        path.resolve(__dirname, 'helpers', 'command-hook-counts.conf.js'),
        { specs: [path.resolve(__dirname, 'mocha', 'command_hook_counts.js')] }
    )
    assert.strictEqual(passed, 1)
    assert.strictEqual(failed, 0)
}

/**
 * wdio-reporter testrunner tests
 */
const reporterTestrunner = async () => {
    const { skippedSpecs, passed, failed } = await launch('reporterTestrunner', baseConfig, {
        specs: [
            path.resolve(__dirname, 'reporter', 'memory.ts'),
        ]
    })
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(passed, 1)
    assert.strictEqual(failed, 0)
}

/**
 * wdio test run with before/after Test/Hook
 */
const wdioHooks = async () => {
    await launch(
        'wdioHooks',
        path.resolve(__dirname, 'helpers', 'hooks.conf.js'),
        {
            specs: [path.resolve(__dirname, 'mocha', 'wdio_hooks.js')]
        }
    )
}

/**
 * Multi-remote wdio testrunner tests
 */
const multiRemote = async () => {
    await launch('multi-remote', baseConfig, {
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

    const { skippedSpecs, passed, failed } = await launch('multi-remote', baseConfig, {
        specs: [
            path.resolve(__dirname, 'multiremote', 'test-filter1.js'),
            path.resolve(__dirname, 'multiremote', 'test-filter2.js')
        ],
        capabilities: {
            browserA: {
                capabilities: { browserName: 'chrome',  }
            },
            browserB: {
                capabilities: {
                    browserName: 'chrome',
                    'wdio:exclude': [
                        path.resolve(__dirname, 'multiremote', 'test-filter2.js')
                    ]
                }
            }
        }
    })
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(passed, 2)
    assert.strictEqual(failed, 0)
}

/**
 * parallel multi-remote wdio testrunner tests
 */
const parallelMultiRemote = async () => {
    console.log(parallelMultiRemoteBaseConfig)
    await launch('parallelMultiRemote', parallelMultiRemoteBaseConfig, {
        specs: [path.resolve(__dirname, 'multiremote', 'test.js')],
    })
}

/**
 * specfile-level retries (fail)
 */
const retryFail = async () => {
    const retryFailed = await launch('retryFailed', baseConfig, {
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
    const retryFilename = path.resolve(__dirname, '.retry_succeeded')
    const logfiles = ['retry_and_pass-0-0.log', 'retry_and_pass-0-1.log'].map(f => path.join(__dirname, f))
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
            specs: [path.resolve(__dirname, 'mocha', 'shared-store-service.js')]
        }
    )
}

/**
 * Mocha with specFiltering feature enabled
 */
const mochaSpecFiltering = async () => {
    const { skippedSpecs } = await launch('mochaSpecFiltering', baseConfig, {
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
            specs: [path.resolve(__dirname, 'mocha', 'standalone.js')]
        }
    )
    assert.strictEqual(skippedSpecs, 0)
}

const severeErrorTest = async () => {
    const onPrepareFailed = await launch('severeErrorTest - onPrepareFailed', baseConfig, {
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
        specs: [path.resolve(__dirname, 'mocha', 'test-empty.js')],
        onWorkerEnd: () => { throw new SevereServiceError('ups') }
    }).then(() => false, () => true)
    assert.equal(onWorkerEndFailed, true, 'Expected onWorkerStart to fail testrun')

    const onCompleteFailed = await launch('severeErrorTest - onCompleteFailed', baseConfig, {
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
            spec: ['./tests-cli-spec-arg/mocha.test03.js']
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
            spec: []
        }
    )
    assert.strictEqual(passed, 3)
    assert.strictEqual(skippedSpecs, 0)
}

/**
 * Run the `wdio` binary so yargs parses the flag the way a user types it.
 *
 * Stdin is ignored and stdout is a pipe. A TTY stdout with a non-TTY stdin
 * makes the CLI wait for a spec list on stdin instead of launching. A pipe
 * is not a TTY, so `wdio run` starts immediately, and the output is still
 * forwarded here.
 *
 * `WDIO_UNIT_TESTS` is removed from this process so a failed run calls
 * `process.exit` with the launcher status. The config puts that variable
 * back on the worker via `runnerEnv`.
 */
function runWdio (configPath, cliArgs) {
    const wdio = path.resolve(__dirname, '..', 'packages', 'wdio-cli', 'bin', 'wdio.js')
    const env = { ...process.env }
    delete env.WDIO_UNIT_TESTS
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [wdio, 'run', configPath, ...cliArgs], {
            cwd: __dirname,
            env,
            stdio: ['ignore', 'pipe', 'pipe']
        })
        child.stdout.on('data', (chunk) => process.stdout.write(chunk))
        child.stderr.on('data', (chunk) => process.stderr.write(chunk))
        let settled = false
        const finish = (err) => {
            if (settled) {
                return
            }
            settled = true
            clearTimeout(timer)
            if (err) {
                reject(err)
                return
            }
            resolve()
        }
        const timer = setTimeout(() => {
            child.kill()
            finish(new Error(`wdio run ${path.basename(configPath)} ${cliArgs.join(' ')} timed out`))
        }, 30000)
        child.on('error', finish)
        child.on('exit', (code) => {
            finish(code === 0
                ? undefined
                : new Error(`wdio run ${path.basename(configPath)} ${cliArgs.join(' ')} exited with ${code}`))
        })
    })
}

/**
 * Ctrl+C during a run hands over to the launcher's graceful shutdown that ends the
 * WebDriver sessions. `create-wdio` must not exit the process first with its prompt
 * cancellation handler.
 */
const sigintGracefulShutdown = async () => {
    /**
     * no POSIX signals or process groups on Windows
     */
    if (process.platform === 'win32') {
        return
    }
    const wdio = path.resolve(__dirname, '..', 'packages', 'wdio-cli', 'bin', 'wdio.js')
    // same env as runWdio: a failed run must exit with the launcher status
    const env = { ...process.env }
    delete env.WDIO_UNIT_TESTS
    const spec = path.resolve(__dirname, 'mocha', 'sigint_long_running.js')
    const child = spawn(process.execPath, [wdio, 'run', baseConfig, '--spec', spec], {
        cwd: __dirname,
        env,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
    })
    let output = ''
    const killGroup = () => {
        try {
            process.kill(-child.pid, 'SIGKILL')
        } catch {}
    }
    const timer = setTimeout(killGroup, 30000)
    const exited = new Promise((resolve) => child.on('exit', resolve))
    const ready = new Promise((resolve) => {
        const onData = (chunk) => {
            output += chunk.toString()
            if (output.includes('SIGINT_SMOKE_READY')) {
                resolve()
            }
        }
        child.stdout.on('data', onData)
        child.stderr.on('data', onData)
    })
    await Promise.race([ready, exited])
    child.kill('SIGINT')
    await exited
    clearTimeout(timer)
    killGroup()
    assert.ok(output.includes('SIGINT_SMOKE_READY'), `the spec never started:\n${output}`)
    assert.ok(output.includes('Ending WebDriver sessions gracefully'), `expected the graceful shutdown message, got:\n${output}`)
    assert.ok(!output.includes('Goodbye'), `create-wdio exited the process on SIGINT:\n${output}`)
}

/**
 * `--headless` / `--headless=false` rewrite browser args before the session
 * starts. The mock driver does not return those args, so the config records
 * the capabilities the worker is about to send.
 */
const headlessFlag = async () => {
    const injectConfig = path.resolve(__dirname, 'helpers', 'headless.conf.js')
    const stripConfig = path.resolve(__dirname, 'helpers', 'headless-strip.conf.js')

    try {
        await fs.rm(headlessCapsLog, { force: true })
        await runWdio(injectConfig, ['--headless'])
        const forced = JSON.parse(await fs.readFile(headlessCapsLog, 'utf8'))
        assert.deepStrictEqual(forced['goog:chromeOptions'].args, [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--headless',
            '--disable-gpu'
        ])

        await fs.rm(headlessCapsLog, { force: true })
        await runWdio(stripConfig, ['--headless=false'])
        const stripped = JSON.parse(await fs.readFile(headlessCapsLog, 'utf8'))
        assert.deepStrictEqual(stripped['goog:chromeOptions'].args, [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ])
    } finally {
        await fs.rm(headlessCapsLog, { force: true })
    }
}

const cliExcludeParamValidationAllExcludedByKeyword = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeParamValidationAllExcludedByKeyword',
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
        'cliExcludeParamValidationSomeExcludedByKeyword',
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
        'cliExcludeParamValidationSomeExcludedByPath',
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
        'cliExcludeParamValidationExcludeNonExistentByKeyword',
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
        'cliExcludeParamValidationExcludeFromConfigByKeyword',
        path.resolve(__dirname, 'tests-cli-exclude-arg/wdio.with-exclude-prop.conf.js')
    )

    assert.strictEqual(passed, 2)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliExcludeParamValidationExcludeMultipleSpecsByPath = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeParamValidationExcludeMultipleSpecsByPath',
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

const cliSpecsWithWildCard = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliSpecsWithWildCard',
        path.resolve(severalPassedConfig),
        {
            spec: ['mocha.test01*.js']
        }
    )
    assert.strictEqual(passed, 2)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliSpecsTheSameWithWildCard = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliSpecsTheSameWithWildCard',
        path.resolve(severalPassedConfig),
        {
            spec: [
                'mocha.test01*.js',
                'mocha.test01*.js'
            ]
        }
    )
    assert.strictEqual(passed, 2)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliSpecsWithWildCardAndGroup = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliSpecsWithWildCardAndGroup',
        path.resolve(severalPassedConfig),
        {
            spec: ['mocha.test01*.js'],
            group: true
        }
    )
    assert.strictEqual(passed, 1)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliExcludeCertainWithWildCard = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeCertainWithWildCard',
        path.resolve(severalPassedConfig),
        {
            spec: ['mocha.test01*.js'],
            exclude: [
                'mocha.test01.js',
            ]
        }
    )
    assert.strictEqual(passed, 1)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliExcludeSomeFromConfWithWildCard = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeSomeFromConfWithWildCard',
        path.resolve(allPassedWildCardConfig),
        {
            exclude: ['mocha.test01*.js'],
        }
    )
    assert.strictEqual(passed, 1)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliExcludeSomeFromConfWithWildCardAndGroup = async () => {
    const { passed, skippedSpecs, failed } = await launch(
        'cliExcludeSomeFromConfWithWildCardAndGroup',
        path.resolve(allPassedWildCardConfig),
        {
            exclude: ['mocha.test01*.js'],
            group: true
        }
    )
    assert.strictEqual(passed, 1)
    assert.strictEqual(skippedSpecs, 0)
    assert.strictEqual(failed, 0)
}

const cliExcludeAllWithWildCard = async () => {
    try {
        await launch(
            'cliExcludeAllWithWildCard',
            path.resolve(allPassedWildCardConfig),
            {
                spec: ['mocha.test*.js'],
                exclude: ['mocha.test*.js'],
            }
        )
        assert.ok(false)
    } catch {
        assert.ok(true)
    }
}
// *** END - tests for CLI --spec ***

// *************************
// *** Tests for Jasmine ***
// *************************
const jasmineHooksTestrunner = async () => {
    const logFile = path.resolve(__dirname, 'jasmineHooksTestrunner.spec.log')
    await launch('jasmineHooksTestrunner',
        path.resolve(__dirname, 'helpers', 'jasmine-hooks.conf.js'),
        {
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

    const specLogs = (await fs.readFile(logFile)).toString().replace(ansiColorRegex, '')
    assert.ok(
        specLogs.includes('skip test'),
    )
}

const jasmineAfterHookArgsValidation = async () => {
    const expectedPassedTestResultPath = path.resolve(__dirname, 'helpers', 'jasmine-after-hook-validation', 'expected-results', 'expectedTestPassed.json')
    const expectedFailedTestResultPath = path.resolve(__dirname, 'helpers', 'jasmine-after-hook-validation', 'expected-results', 'expectedTestFailed.json')

    // Actual test results are written to files in tests\helpers\jasmine.after-hook-validation.conf.js - afterTest()
    const actualPassedTestResultPath = path.resolve(__dirname, 'helpers', 'actualResultsPassed.log')
    const actualFailedTestResultPath = path.resolve(__dirname, 'helpers', 'actualResultsFailed.log')

    await launch('jasmineAfterHookArgsValidation',
        path.resolve(__dirname, 'helpers', 'jasmine.after-hook-validation.conf.js'),
        {
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
    delete actualPassedTestLogs.test.file
    delete actualPassedTestLogs.result.start
    delete actualPassedTestLogs.result.filename
    delete actualPassedTestLogs.result.file
    delete actualPassedTestLogs.duration
    delete actualFailedTestLogs.test.start
    delete actualFailedTestLogs.test.filename
    delete actualFailedTestLogs.test.file
    delete actualFailedTestLogs.test.failedExpectations[0].stack
    delete actualFailedTestLogs.error.stack
    delete actualFailedTestLogs.result.start
    delete actualFailedTestLogs.result.filename
    delete actualFailedTestLogs.result.file
    delete actualFailedTestLogs.result.failedExpectations[0].stack
    delete actualFailedTestLogs.duration

    assert.deepStrictEqual(actualPassedTestLogs, expectedPassedTestLogs)
    assert.deepStrictEqual(actualFailedTestLogs, expectedFailedTestLogs)
}
// *** END - Tests for Jasmine ***

(async () => {
    const smokeTests = [
        watchMode,
        watchFilesToWatch,
        mochaTestrunner,
        jasmineTestrunner,
        multiRemote,
        parallelMultiRemote,
        wdioHooks,
        cjsTestrunner,
        sharedStoreServiceTest,
        mochaSpecGrouping,
        cucumberTestrunner,
        cucumberTestrunnerByLineNumber,
        cucumberTestrunnerMultipleByLineNumber,
        cucumberFailAmbiguousDefinitions,
        cucumberPendingTest,
        cucumberReporter,
        cucumberGroupedSpecsRandomOrder,
        cucumberGroupedSpecsRandomOrderHistory,
        cucumberSameFeatureFileName,
        cucumberJsJsonReporter,
        cucumberJsJsonReporterMultiRemote,
        cucumberJsJsonReporterLanguageAndUndefined,
        cucumberJsJsonReporterAmbiguous,
        cucumberJsJsonReporterGroupedSpecs,
        cucumberJsJsonReporterHookStatus,
        cucumberFileOption,
        cucumberSkipTag,
        standaloneTest,
        mochaAsyncTestrunner,
        customService,
        customCJSService,
        mochaSpecFiltering,
        jasmineSpecFiltering,
        jasmineReporter,
        jasmineCustomMatcher,
        jasmineMultiRemote,
        jasmineTimeout,
        mochaTimeout,
        jasmineAfterAll,
        jasmineFailSpecWithNoExpectations,
        retryFail,
        retryPass,
        customReporterString,
        customReporterObject,
        sessionGoneReport,
        commandHookCounts,
        reporterTestrunner,
        severeErrorTest,
        nonGlobalTestrunner,
        mochaHooksTestrunner,
        runSpecsWithFlagAllPassed,
        runSpecsWithFlagSeveralPassed,
        runSpecsWithFlagDirectPath,
        runSpecsWithFlagNoArg,
        headlessFlag,
        sigintGracefulShutdown,
        jasmineHooksTestrunner,
        jasmineAfterHookArgsValidation,
        cliExcludeParamValidationAllExcludedByKeyword,
        cliExcludeParamValidationSomeExcludedByKeyword,
        cliExcludeParamValidationSomeExcludedByPath,
        cliExcludeParamValidationExcludeNonExistentByKeyword,
        cliExcludeParamValidationExcludeFromConfigByKeyword,
        cliExcludeParamValidationExcludeMultipleSpecsByPath,
        cliSpecsWithWildCard,
        cliSpecsTheSameWithWildCard,
        cliSpecsWithWildCardAndGroup,
        cliExcludeCertainWithWildCard,
        cliExcludeSomeFromConfWithWildCard,
        cliExcludeSomeFromConfWithWildCardAndGroup,
        cliExcludeAllWithWildCard
    ]

    console.log('\nRunning smoke tests...\n')
    await runTests(smokeTests)

    console.log('\nAll smoke tests passed!\n')
    process.exit(0)
})().catch((e) => {
    console.log(e.stack)

    process.exit(1)
})
