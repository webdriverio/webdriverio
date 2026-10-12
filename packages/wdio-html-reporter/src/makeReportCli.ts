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
    return reportAggregator.reportFile
}
