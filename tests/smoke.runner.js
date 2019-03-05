import fs from 'fs'
import path from 'path'
import assert from 'assert'

import launch from './helpers/launch'
import { SERVICE_LOGS, LAUNCHER_LOGS, REPORTER_LOGS } from './helpers/fixtures'

(async () => {
    /**
     * normal wdio testrunner tests
     */
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        { specs: [path.resolve(__dirname, 'mocha', 'test.js')] })

    /**
     * wdio test run with custom service
     */
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'mocha', 'service.js')],
            services: [['smoke-test', { foo: 'bar' }]]
        })
    const serviceLogs = fs.readFileSync(path.join(__dirname, 'helpers', 'service.log'))
    assert.equal(serviceLogs, SERVICE_LOGS)
    const launcherLogs = fs.readFileSync(path.join(__dirname, 'helpers', 'launcher.log'))
    assert.equal(launcherLogs, LAUNCHER_LOGS)

    /**
     * wdio test run with custom reporter as string
     */
    await launch(
        path.resolve(__dirname, 'helpers', 'config.js'),
        {
            specs: [path.resolve(__dirname, 'mocha', 'reporter.js')],
            reporters: [['smoke-test', { foo: 'bar' }]]
        })
    const reporterLogsPath = path.join(__dirname, 'helpers', 'wdio-0-0-smoke-test-reporter.log')
    const reporterLogs = fs.readFileSync(reporterLogsPath)
    assert.equal(reporterLogs, REPORTER_LOGS)
    fs.unlinkSync(reporterLogsPath)

    /**
     * wdio test run with custom reporter as object
     */
    await launch(path.resolve(__dirname, 'helpers', 'reporter.conf.js'), {})
    const reporterLogsWithReporterAsObjectPath = path.join(__dirname, 'helpers', 'wdio-0-0-CustomSmokeTestReporter-reporter.log')
    const reporterLogsWithReporterAsObject = fs.readFileSync(reporterLogsWithReporterAsObjectPath)
    assert.equal(reporterLogsWithReporterAsObject, REPORTER_LOGS)
    fs.unlinkSync(reporterLogsWithReporterAsObjectPath)

    /**
     * multiremote wdio testrunner tests
     */
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

    /**
     * for some reason the process get stuck therefor exit it
     */
    process.exit(0)
})().catch((e) => {
    // eslint-disable-next-line no-console
    console.log(e.stack)

    process.exit(1)
})
