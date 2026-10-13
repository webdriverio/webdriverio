import fs from 'node:fs'

import ReportAggregator from './reportAggregator.js'

/**
 * Create the master report from the command line:
 * `node build/makeReport.js [report file name] [folder of the JSON files] [report title]`
 * @returns the path of the report
 */
export async function makeReport (args: string[], env: Record<string, string | undefined> = process.env) {
    const [reportName = 'master-report.html', outputDir = 'reports/html-reports/', reportTitle = 'Master Report'] = args
    const reportAggregator = new ReportAggregator({
        outputDir,
        filename: reportName,
        reportTitle,
        browserName: env.TEST_BROWSER ?? 'unspecified',
        // no browser to open in CI
        showInBrowser: !env.CI
    } as ConstructorParameters<typeof ReportAggregator>[0])
    await reportAggregator.createReport()
    // the aggregator logs some errors and does not throw them
    if (!fs.existsSync(reportAggregator.reportFile)) {
        throw new Error(`No report was made at ${reportAggregator.reportFile}`)
    }
    return reportAggregator.reportFile
}

/**
 * Run `makeReport` for the command line
 * @returns the exit code: 1 when no report was made, so a CI step fails
 */
export async function runCli (args: string[], env: Record<string, string | undefined> = process.env) {
    try {
        await makeReport(args, env)
        return 0
    } catch (error: unknown) {
        console.error(error)
        return 1
    }
}
