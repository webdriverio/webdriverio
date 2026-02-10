import path from 'node:path'
import { SevereServiceError } from 'webdriverio'
import type { Options, Reporters } from '@wdio/types'
import type { AppiumServiceConfig } from '../../types.js'

/**
 * Checks if a reporter with the given name is already registered in the config.
 */
export function isReporterRegistered(reporters: Reporters.ReporterEntry[], reporterName: string): boolean {
    return reporters.some((reporter) => {
        if (Array.isArray(reporter)) {
            const reporterClass = reporter[0]
            if (typeof reporterClass === 'function') {
                return reporterClass.name === reporterName
            }
            return false
        }
        if (typeof reporter === 'function') {
            return reporter.name === reporterName
        }
        return false
    })
}

/**
 * Determines the report directory path using the fallback chain:
 * 1. reportPath from trackSelectorPerformance service options
 * 2. config.outputDir
 * 3. appiumServiceOptions.logPath
 * 4. appiumServiceOptions.args.log (directory from log file path)
 * 5. Throws error if none are set
 */
export function determineReportDirectory(
    reportPath?: string,
    config?: Options.Testrunner,
    appiumServiceOptions?: AppiumServiceConfig
): string {
    let reportDir: string | undefined

    if (reportPath) {
        reportDir = path.isAbsolute(reportPath) ? reportPath : path.join(process.cwd(), reportPath)
    } else if (config?.outputDir) {
        reportDir = path.isAbsolute(config.outputDir) ? config.outputDir : path.join(process.cwd(), config.outputDir)
    } else if (appiumServiceOptions?.logPath) {
        reportDir = path.isAbsolute(appiumServiceOptions.logPath)
            ? appiumServiceOptions.logPath
            : path.join(process.cwd(), appiumServiceOptions.logPath)
    } else if (appiumServiceOptions?.args?.log) {
        const logPath = appiumServiceOptions.args.log
        reportDir = path.isAbsolute(logPath) ? path.dirname(logPath) : path.join(process.cwd(), path.dirname(logPath))
    }

    if (!reportDir) {
        throw new SevereServiceError(
            'Mobile Selector Performance Optimizer: JSON report cannot be created. ' +
            'Please provide one of the following:\n' +
            '  1. reportPath in trackSelectorPerformance service options\n' +
            '  2. outputDir in WebdriverIO config\n' +
            '  3. logPath in Appium service options\n' +
            '  4. log in Appium service args'
        )
    }

    return reportDir
}
