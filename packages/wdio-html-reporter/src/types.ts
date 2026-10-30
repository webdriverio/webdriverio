import type { SuiteStats, RunnerStats } from '@wdio/reporter'
import type { Reporters } from '@wdio/types'

export class HtmlReporterOptions implements Reporters.Options  {
    [key: string]: unknown;
    outputDir: string
    filename: string
    reportTitle: string
    showInBrowser?: boolean | undefined
    collapseTests?: boolean
    collapseSuites?: boolean
    useOnAfterCommandForScreenshot?: boolean | undefined
    debug ?: boolean | undefined
    browserName:string
    removeOutput?: boolean | undefined
    linkScreenshots?: boolean
    /** make the http and https URLs in log messages links (the text stays escaped) */
    linkUrls?: boolean
    produceJson?:boolean | undefined
    /** also write an HTML report for each worker (next to its JSON file) */
    produceHtml?: boolean

    constructor() {
        this.outputDir = 'reports/html-reports/'
        this.filename =  'report.html'
        this.reportTitle =  'Test Report Title'
        this.showInBrowser = false
        this.collapseTests = false
        this.collapseSuites = false
        this.useOnAfterCommandForScreenshot = false
        this.debug = false
        this.browserName = 'not specified'
        this.removeOutput = true
        this.linkScreenshots = false
        this.linkUrls = false
        this.produceJson = true
    }
}

export class Metrics   {
    passed : number
    skipped : number
    failed : number
    start?: string
    end?: string
    duration: number

    constructor() {
        this.passed = 0
        this.skipped = 0
        this.failed = 0
        this.duration = 0
    }
}

export class InternalReportEvent  {
    type: string
    value: unknown

    constructor(type: string, value: unknown) {
        this.type = type
        this.value = value
    }

}

/** a suite of the report; the root suite lists in `files` the spec files of its tests when there are several */
export type ReportSuite = SuiteStats & { files?: string[] }

export class ReportData {
    info: RunnerStats
    metrics: Metrics
    suites: SuiteStats[]
    // specs: RunnerStats[] ;
    title: string
    reportFile: string
    browserName: string
    /** a master report of the ReportAggregator, not the report of a worker */
    master?: boolean
    /** a message for the reader, for example why the report has no results */
    message?: string
    /** a worker file written at the runner start: the report at the runner end replaces it */
    incomplete?: boolean
    constructor(title: string, info: RunnerStats, suites: SuiteStats[], metrics: Metrics, reportFile:string, browserName :string) {
        this.info = info
        this.metrics = metrics
        this.title = title
        this.suites = suites
        this.reportFile = reportFile
        this.browserName = browserName
    }
}