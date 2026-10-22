import HtmlGenerator from './htmlGenerator.js'
import { HtmlReporterOptions, Metrics, ReportData } from './types.js'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
dayjs.extend(utc)
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js'
dayjs.extend(isSameOrBefore)
import type { SuiteStats } from '@wdio/reporter'
import open from 'open'
import fs from 'node:fs'
import path from 'node:path'
import logger from '@wdio/logger'
import JsonGenerator from './jsonGenerator.js'
import { emptyDir } from './files.js'
import { withExtension } from './fileNames.js'

const timeFormat ='YYYY-MM-DDTHH:mm:ss.SSS[Z]'

function  walk(dir:string, extensions: string[], filelist: string[] = []) {
    const files = fs.readdirSync(dir)

    files.forEach(function (file : string) {
        const filepath = path.join(dir, file)
        const stat = fs.statSync(filepath)

        if (stat.isDirectory()) {
            filelist = walk(filepath, extensions, filelist)
        } else if (extensions.some((extension) => file.endsWith(extension))) {
            filelist.push(filepath)
        }
    })

    return filelist
}

type ReportSuite = { tests?: { events?: { type?: string, value?: unknown }[] }[], suites?: ReportSuite[] }

/**
 * Remove the videos that have no file. `@wdio/video-reporter` sends the path of a
 * video before its render: when the render fails, there is no file. The master
 * report is made after all workers, so a video that does not exist now never will.
 */
function removeMissingVideos (suites: ReportSuite[] = []) {
    for (const suite of suites) {
        for (const test of suite.tests ?? []) {
            if (Array.isArray(test.events)) {
                test.events = test.events.filter((event) => event.type !== 'video-capture' ||
                    (typeof event.value === 'string' && fs.existsSync(event.value)))
            }
        }
        removeMissingVideos(suite.suites)
    }
}

class ReportAggregator {
    private LOG = logger('ReportAggregator')
    constructor(opts: Partial<HtmlReporterOptions> = {}) {
        this.options  = Object.assign(new HtmlReporterOptions(), {
            outputDir: 'reports/html-reports/',
            filename: 'master-report.html',
            reportTitle: 'Test Master Report'
        }, opts)

        this.reports = []
    }
    public options: HtmlReporterOptions
    public reportFile : string = ''
    /**
     * true when the last createReport failed for a part of the report (it logs the errors)
     */
    public failed = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public reports: any[]

    clean() {
        emptyDir(this.options.outputDir)
    }

    readJsonFiles() {
        // the JSON of the master report is in the same folder: it is not the result of a worker
        const masterJson = withExtension(path.resolve(process.cwd(), this.options.outputDir, this.options.filename), '.json')
        return walk(this.options.outputDir, ['.json']).filter((file) => path.resolve(file) !== masterJson)
    }
    updateSuiteMetrics(metrics: Metrics, suiteInfo : SuiteStats) {
        const start = dayjs.utc(suiteInfo.start)
        if (metrics.start) {
            if (start.isBefore(metrics.start)) {
                metrics.start = start.utc().format(timeFormat)
            }
        } else {
            metrics.start = start.utc().format(timeFormat)
        }
        const end = dayjs.utc(suiteInfo.end)
        if (metrics.end) {
            if (end.isAfter(dayjs.utc(metrics.end))) {
                metrics.end = end.utc().format(timeFormat)
            }
        } else {
            metrics.end = end.utc().format(timeFormat)
        }
        this.LOG.info(`Included metrics for suite: ${suiteInfo.cid} ${suiteInfo.uid}` )
    }

    async createReport( ) {
        this.LOG.info('Report Aggregation started')
        const metrics = new Metrics ()
        const suites : SuiteStats[] = []
        const specs : string[] =  []

        this.reports = []
        /**
         * no folder when no worker wrote a report (for example a configuration error):
         * still make the report that says so
         */
        fs.mkdirSync(this.options.outputDir, { recursive: true })
        const files = this.readJsonFiles()
        if (files.length === 0) {
            this.LOG.error(`No Json files found in: ${this.options.outputDir}. Make sure options.produceJson is not false`)
        }
        /**
         * a file that cannot be read or parsed (a worker that stopped while it wrote it)
         * makes the report incomplete; a valid JSON file of another tool is only skipped
         */
        let inputFailed = false
        /** the workers that stopped before they wrote their results, or could not write them */
        const incomplete: string[] = []
        /** the workers whose session did not start: they have no tests */
        const notStarted: string[] = []
        const workerOf = (report: { info?: { cid?: string, specs?: string[] } }) =>
            `${report.info?.cid} (${(report.info?.specs ?? []).map((spec: string) => path.basename(spec)).join(', ')})`
        for (let i = 0; i < files.length; i++) {
            try {
                const filename = files[i]
                let report
                try {
                    report = JSON.parse(fs.readFileSync(filename, 'utf-8'))
                } catch (ex) {
                    inputFailed = true
                    console.error(`Cannot read the report file ${filename}: ${ex}`)
                    continue
                }
                // a master report of another name (for example from the command line)
                if (report.master) {
                    this.LOG.info(`Skip the master report ${filename}`)
                    continue
                }
                if (report.incomplete) {
                    incomplete.push(workerOf(report))
                    continue
                }
                if (report.info?.sessionFailed) {
                    notStarted.push(workerOf(report))
                }
                if (!report.info || !report.info.specs) {
                    this.LOG.error('report structure in question, no info or info.specs ', JSON.stringify(report))
                    this.LOG.debug('report content: ', JSON.stringify(report))
                    continue
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                report.info.specs.forEach((spec: any) => {
                    specs.push(spec)
                })
                this.reports.push(report)
            } catch (ex) {
                console.error(ex)
            }
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.reports.sort((report1:any, report2:any) => {
            const first = dayjs.utc(report1.info.start)
            const second = dayjs.utc(report2.info.start)
            if (first.isAfter(second)) {
                return 1
            } else if (first.isBefore(second)) {
                return -1
            }
            return  0
        })
        for (let j = 0; j < this.reports.length; j++) {
            try {
                const report = this.reports[j]
                metrics.passed += report.metrics.passed
                metrics.failed += report.metrics.failed
                metrics.skipped += report.metrics.skipped
                removeMissingVideos(report.suites)
                for (let k = 0; k < report.suites.length; k++) {
                    const suiteInfo = report.suites[k]
                    this.updateSuiteMetrics(metrics, suiteInfo)
                    suites.push(suiteInfo)
                }
            } catch (ex) {
                console.error(ex)
            }
        }

        if (!metrics.start || !metrics.end) {
            this.LOG.error(`Invalid Metrics computed: ${metrics.start} -- ${metrics.end}`)
        }
        metrics.duration = dayjs.duration(dayjs(metrics.end).utc().diff(dayjs(metrics.start).utc())).as('milliseconds')

        /**
         * no worker results (for example `produceJson: false`, or a CI step that did not
         * download them) also makes the report fail
         */
        const noWorkerReport = !this.reports || !this.reports.length
        if (noWorkerReport) {
            // the test failed hard at the beginning.  Create a dummy structure to get through html generation
            const report = {
                'info' : {
                    'cid': 'The execution of the test suite has failed before report generation was started.  Please look at the logs to determine the error, this is likely an issue with your configuration files.',
                    'config': {
                        'hostname': 'localhost'
                    },
                    'specs': [],
                    'suites': [
                        {
                            'uid': 'Test Start Failure',
                            'title': 'Test Start Failure',
                            'type': 'suite',
                            'tests': [],
                        }
                    ]
                }
            }
            this.reports = []
            this.reports.push(report)
        }

        this.LOG.info('Aggregated ' + specs.length + ' specs, ' + suites.length + ' suites, ' )
        this.reportFile = path.resolve(process.cwd(), this.options.outputDir, this.options.filename)

        const reportData = new ReportData(
            this.options.reportTitle,
            this.reports[0].info,
            suites,
            metrics,
            this.reportFile,
            this.options.browserName)
        reportData.master = true
        const problems = [
            ...(incomplete.length ? [`worker ${incomplete.join(', ')} stopped before it wrote its results, or could not write them`] : []),
            ...(notStarted.length ? [`worker ${notStarted.join(', ')} could not start its session`] : [])
        ]
        if (problems.length) {
            reportData.message = `The report is not complete: ${problems.join('; ')}. See the logs of the run.`
        } else if (noWorkerReport) {
            reportData.message = `${this.reports[0].info.cid}`
        }

        this.failed = false
        try {
            await JsonGenerator.jsonOutput(this.options, reportData)
            this.failed = !await HtmlGenerator.htmlOutput(this.options, reportData) || inputFailed || noWorkerReport || problems.length > 0
            await this.finalize()
            this.LOG.info('Report Aggregation completed')

        } catch (ex) {
            this.failed = true
            console.error('Report Aggregation failed: ' + ex)
        }
    }
    async finalize() {
        // `HtmlGenerator.htmlOutput` already copied the CSS and the font next to the report
        if (this.options.showInBrowser) {
            await open(this.reportFile)
            this.LOG.info('browser launched')
        }
        this.LOG.info('HTML Report Generation complete')
        console.info('HTML Report Generation complete')
    }

}

export default ReportAggregator

