import fs from 'fs'
import path from 'path'
import assert from 'assert'

import launch from './helpers/launch'
import { SERVICE_LOGS, LAUNCHER_LOGS, REPORTER_LOGS } from './helpers/fixtures'

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Mocha wdio testrunner tests
 */
const mochaTestrunner = async () => {
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        { specs: [path.resolve(__dirname, 'mocha', 'test.js')] })
}
/**
 * Jasmine wdio testrunner tests
 */
const jasmineTestrunner = async () => {
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'jasmine', 'test.js')],
            framework: 'jasmine'
        })
}

/**
 * Cucumber wdio testrunner tests
 */
const cucumberTestrunner = async () => {
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'cucumber', 'test.feature')],
            framework: 'cucumber',
            cucumberOpts: {
                ignoreUndefinedDefinitions: true
            }
        }
    )
}

/**
 * Cucumber fail due to failAmbiguousDefinitions
 */
const cucumberFailAmbiguousDefinitions = async () => {
    const hasFailed = await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'cucumber', 'test.feature')],
            framework: 'cucumber',
            cucumberOpts: {
                ignoreUndefinedDefinitions: true,
                failAmbiguousDefinitions: true
            }
        }
    ).then(
        () => false,
        () => true
    )
    assert.equal(hasFailed, true)
}

/**
 * wdio test run with custom service
 */
const customService = async () => {
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'mocha', 'service.js')],
            services: [['smoke-test', { foo: 'bar' }]]
        })
    await sleep(100)
    const serviceLogs = fs.readFileSync(path.join(__dirname, 'helpers', 'service.log'))
    assert.equal(serviceLogs.toString(), SERVICE_LOGS)
    const launcherLogs = fs.readFileSync(path.join(__dirname, 'helpers', 'launcher.log'))
    assert.equal(launcherLogs.toString(), LAUNCHER_LOGS)
}

/**
 * wdio test run with custom reporter as string
 */
const customReporterString = async () => {
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'mocha', 'reporter.js')],
            reporters: [['smoke-test', { foo: 'bar' }]]
        })
    await sleep(100)
    const reporterLogsPath = path.join(__dirname, 'helpers', 'wdio-0-0-smoke-test-reporter.log')
    const reporterLogs = fs.readFileSync(reporterLogsPath)
    assert.equal(reporterLogs.toString(), REPORTER_LOGS)
    fs.unlinkSync(reporterLogsPath)
}

/**
 * wdio test run with custom reporter as object
 */
const customReporterObject = async () => {
    await launch(path.resolve(__dirname, 'helpers', 'reporter.conf.js'), {})
    const reporterLogsWithReporterAsObjectPath = path.join(__dirname, 'helpers', 'wdio-0-0-CustomSmokeTestReporter-reporter.log')
    const reporterLogsWithReporterAsObject = fs.readFileSync(reporterLogsWithReporterAsObjectPath)
    assert.equal(reporterLogsWithReporterAsObject.toString(), REPORTER_LOGS)
    fs.unlinkSync(reporterLogsWithReporterAsObjectPath)
}

/**
 * wdio test run with before/after Test/Hook
 */
const wdioHooks = async () => {
    await launch(
        path.resolve(__dirname, 'helpers', 'hooks.conf.js'),
        { specs: [path.resolve(__dirname, 'mocha', 'wdio_hooks.js')] })
}

/**
 * multiremote wdio testrunner tests
 */
const multiremote = async () => {
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'multiremote', 'test.js')],
            capabilities: {
                browserA: {
                    capabilities: { browserName: 'chrome' }
                },
                browserB: {
                    capabilities: { browserName: 'chrome' }
                }
            }
        }
    )
}

/**
 * specfile-level retries (fail)
 */
const retryFail = async () => {
    const retryFailed = await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'mocha', 'retry_and_fail.js')],
            specFileRetries: 1
        }
    ).then(
        () => false,
        () => true
    )
    assert.equal(retryFailed, true, 'Expected retries to fail but they passed')
}

/**
 * specfile-level retries (pass)
 */
const retryPass = async () => {
    let retryFilename = path.join(__dirname, '.retry_succeeded')
    let logfiles = ['wdio-0-0.log', 'wdio-0-1.log'].map(f => path.join(__dirname, f))
    let rmfiles = [retryFilename, ...logfiles]
    rmfiles.forEach(filename => {
        if (fs.existsSync(filename)) {
            fs.unlink(filename, err => {
                if (err) {
                    throw Error(`Unable to delete ${filename}`)
                }
            })
        }
    })
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'mocha', 'retry_and_pass.js')],
            outputDir: path.dirname(logfiles[0]),
            specFileRetries: 1,
            retryFilename
        })
    if (!fs.existsSync(logfiles[0])) {
        throw Error(`Expected ${logfiles[0]} to exist but it does not`)
    }
    if (fs.existsSync(logfiles[1])) {
        throw Error(`Expected ${logfiles[1]} to not exist but it does`)
    }
}

(async () => {
    /**
     * Usage example: `npm run test:smoke -- customService`
     */
    const testFilter = process.argv[2]

    const tests = [
        mochaTestrunner,
        jasmineTestrunner,
        cucumberTestrunner,
        cucumberFailAmbiguousDefinitions,
        customService,
        customReporterString,
        customReporterObject,
        multiremote,
        retryFail,
        retryPass,
        wdioHooks,
    ]

    if (process.env.CI || testFilter) {
        // sequential
        const testsFiltered = testFilter ? tests.filter(test => test.name === testFilter) : tests
        for (let test of testsFiltered) {
            await test()
        }
    } else {
        // parallel
        await Promise.all(tests.map(test => test()))
    }

    console.log('\nAll smoke tests passed!\n')
})().catch((e) => {
    // eslint-disable-next-line no-console
    console.log(e.stack)

    process.exit(1)
})
