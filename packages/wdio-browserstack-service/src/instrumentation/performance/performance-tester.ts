import { createObjectCsvWriter } from 'csv-writer'
import fs from 'node:fs'
import fsPromise from 'node:fs/promises'
import type { EntryType } from 'node:perf_hooks'
import { performance, PerformanceObserver } from 'node:perf_hooks'
import util from 'node:util'
import worker from 'node:worker_threads'
import path from 'node:path'
import { arch, hostname, platform, type, version } from 'node:os'

import { BStackLogger } from '../../bstackLogger.js'
import { PERF_MEASUREMENT_ENV } from '../../constants.js'
import APIUtils from '../../cli/apiUtils.js'
import { CLIUtils } from '../../cli/cliUtils.js'
import { SDK_EVENTS_LIST, EVENTS } from './constants.js'
import fetchWrap from '../../fetchWrapper.js'
import type { CsvWriter } from 'csv-writer/src/lib/csv-writer.js'
import type { ObjectMap } from 'csv-writer/src/lib/lang/object.js'
import type { Browser } from 'webdriverio'

type PerformanceDetails = {
    success?: true,
    failure?: string,
    testName?: string,
    worker?: string | number,
    clientWorkerId?: string,
    command?: string,
    hookType?: string,
    platform?: string | number
}

export default class PerformanceTester {
    static _observer: PerformanceObserver
    static _csvWriter: CsvWriter<ObjectMap<{}>>
    private static _events: PerformanceEntry[] = []
    private static _measuredEvents: PerformanceEntry[] = []
    private static _hasStoppedGeneration = false
    private static _stopGenerateCallCount = 0
    static started = false
    static details: { [key: string]: PerformanceDetails } = {}
    static eventsMap: { [key: string]: number } = {}
    static browser?: Browser
    static scenarioThatRan: string[]
    static jsonReportDirName = 'performance-report'
    static jsonReportDirPath = path.join(process.cwd(), 'logs', this.jsonReportDirName)
    static jsonReportFileName = `${this.jsonReportDirPath}/performance-report-${PerformanceTester.getProcessId()}.json`

    // SDK only writes SDK-specific events to event_sdk.json
    // Binary handles writing event_cli.json and event_requests.json based on clientWorkerId from gRPC
    //static sdkEventsFileName = '/Users/aakashhotchandani/Documents/SDKStories/Performance/browserstack-binary/event_sdk.json'

    static startMonitoring(csvName: string = 'performance-report.csv') {

        // Create performance-report dir if not exists already
        if (!fs.existsSync(this.jsonReportDirPath)) {
            fs.mkdirSync(this.jsonReportDirPath, { recursive: true })
        }
        this._observer = new PerformanceObserver(list => {
            list.getEntries()
                .filter((entry) => entry.entryType === 'measure')
                .forEach(entry => {
                    let finalEntry: any = entry
                    finalEntry = entry.toJSON()

                    try {
                        if (typeof finalEntry.startTime === 'number' && typeof performance.timeOrigin === 'number') {
                            const originalStartTime = finalEntry.startTime
                            finalEntry.startTime = performance.timeOrigin + finalEntry.startTime
                            BStackLogger.debug(`Timestamp conversion for ${entry.name}: ${originalStartTime} -> ${finalEntry.startTime} (timeOrigin: ${performance.timeOrigin})`)
                        }
                    } catch (e) {
                        BStackLogger.debug(`Error converting startTime to epoch: ${util.format(e)}`)
                    }

                    if (this.details[entry.name]) {
                        finalEntry = Object.assign(finalEntry, this.details[entry.name])
                    }
                    delete this.details[entry.name]
                    this._measuredEvents.push(finalEntry)
                }
                )

            if (process.env[PERF_MEASUREMENT_ENV]) {
                list.getEntries().forEach((entry) => this._events.push(entry))
            }
        })
        const entryTypes: EntryType[] = ['measure']
        if (process.env[PERF_MEASUREMENT_ENV]) {
            entryTypes.push('function')
        }
        this._observer.observe({ buffered: true, entryTypes: entryTypes })
        this.started = true
        if (process.env[PERF_MEASUREMENT_ENV]) {
            this._csvWriter = createObjectCsvWriter({
                path: csvName,
                header: [
                    { id: 'name', title: 'Function Name' },
                    { id: 'time', title: 'Execution Time (ms)' }
                ]
            })
        }
    }

    static calculateTimes(methods: string[]) : number {
        const times: { [key: string]: number } = {}
        this._events.map((entry) => {
            if (!times[entry.name]) {
                times[entry.name] = 0
            }
            times[entry.name] += entry.duration
        })
        const timeTaken = methods.reduce((a, c) => {
            return times[c] + (a || 0)
        }, 0)
        BStackLogger.debug(`Time for ${methods} is ${timeTaken}`)
        return timeTaken
    }

    static async stopAndGenerate(filename: string = 'performance-own.html') {
        if (!this.started) {
            return
        }
        try {
            const eventsJson = JSON.stringify(this._measuredEvents)
            // remove enclosing array and add a trailing comma so that we
            // dont need to both read and then write the file, we can use append instead
            const finalJSONStr = eventsJson.slice(1, -1) + ','
            await fsPromise.appendFile(this.jsonReportFileName, finalJSONStr)
        } catch (er) {
            BStackLogger.debug(`Failed to write events of the worker to ${this.jsonReportFileName}: ${util.format(er)}`)
        }
        this._observer.disconnect()

        if (!process.env[PERF_MEASUREMENT_ENV]) {
            return
        }

        this.started = false

        // Generate CSV and HTML reports using directly collected events
        this.generateCSV(this._events)

        const content = this.generateReport(this._events)
        const dir = path.join(process.cwd(), filename)
        try {
            await fsPromise.writeFile(dir, content)
            BStackLogger.info(`Performance report is at ${path}`)
        } catch (err) {
            BStackLogger.error(`Error in writing html ${util.format(err)}`)
        }
    }

    static generateReport(entries: PerformanceEntry[]) {
        let html = '<!DOCTYPE html><html><head><title>Performance Report</title></head><body>'
        html += '<h1>Performance Report</h1>'
        html += '<table><thead><tr><th>Function Name</th><th>Duration (ms)</th></tr></thead><tbody>'
        entries.forEach((entry) => {
            html += `<tr><td>${entry.name}</td><td>${entry.duration}</td></tr>`
        })
        html += '</tbody></table></body></html>'
        return html
    }

    static generateCSV(entries: PerformanceEntry[]) {
        const times: { [key: string]: number } = {}
        entries.map((entry) => {
            if (!times[entry.name]) {
                times[entry.name] = 0
            }
            times[entry.name] += entry.duration

            return {
                name: entry.name,
                time: entry.duration
            }
        })
        const dat = Object.entries(times).map(([key, value]) => {
            return {
                name: key,
                time: value
            }
        })
        this._csvWriter.writeRecords(dat)
            .then(() => BStackLogger.info('Performance CSV report generated successfully'))
            .catch((error: Error) => console.error(error))
    }

    static Measure(label: string, details: PerformanceDetails = {}) {
        const self = this
        return (
            target: object,
            key: string | symbol,
            descriptor: TypedPropertyDescriptor<Function>) => {
            const originalMethod: Function|undefined = descriptor.value
            if (descriptor.value) {
                descriptor.value = function(...args: object[]) {
                    return PerformanceTester.measure.apply(self, [label, originalMethod as Function, { methodName: key.toString(), ...details }, args, this])
                }
            }
        }
    }

    static measureWrapper(name: string, fn: Function, details: PerformanceDetails = {}) {
        const self = this

        details.worker = PerformanceTester.getProcessId()
        details.testName = PerformanceTester.scenarioThatRan && PerformanceTester.scenarioThatRan[PerformanceTester.scenarioThatRan.length - 1]
        details.platform = PerformanceTester.browser?.sessionId

        return function (...args: (object|boolean|undefined|null|string)[]) {

            return self.measure(name, fn, details, args)
        }

    }

    static isEnabled() {
        return !(process.env.BROWSERSTACK_SDK_INSTRUMENTATION === 'false')
    }

    static measure(label: string, fn: Function, details = {}, args?: (object|boolean|undefined|null|string)[], thisArg: object|null = null) {
        if (!this.started || !this.isEnabled()) {
            return fn.apply(thisArg, args)
        }

        // Generate unique mark names for this specific call to avoid timing conflicts
        const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
        const startMark = `${label}-start-${uniqueId}`
        const endMark = `${label}-end-${uniqueId}`

        // Create the start mark with unique ID
        performance.mark(startMark)

        // Store details with measurement context
        const detailsWithContext = {
            ...details,
            measurementId: uniqueId
        }

        try {
            const returnVal = fn.apply(thisArg, args)

            if (returnVal instanceof Promise) {
                return new Promise((resolve, reject) => {
                    returnVal
                        .then(v => {
                            // Use specific marks for this call
                            performance.mark(endMark)
                            performance.measure(label, startMark, endMark)

                            this.details[label] = Object.assign({
                                success: true,
                                failure: undefined
                            }, Object.assign(Object.assign({
                                clientWorkerId: PerformanceTester.getClientWorkerId(),
                                worker: PerformanceTester.getProcessId(),
                                platform: PerformanceTester.browser?.sessionId,
                                testName: PerformanceTester.scenarioThatRan?.pop()
                            }, detailsWithContext), this.details[label] || {}))

                            resolve(v)
                        }).catch(e => {
                            performance.mark(endMark)
                            performance.measure(label, startMark, endMark)

                            this.details[label] = Object.assign({
                                success: false,
                                failure: util.format(e)
                            }, Object.assign(Object.assign({
                                clientWorkerId: PerformanceTester.getClientWorkerId(),
                                worker: PerformanceTester.getProcessId(),
                                platform: PerformanceTester.browser?.sessionId,
                                testName: PerformanceTester.scenarioThatRan?.pop()
                            }, detailsWithContext), this.details[label] || {}))

                            reject(e)
                        })
                })
            }

            // Synchronous execution
            performance.mark(endMark)
            performance.measure(label, startMark, endMark)

            this.details[label] = Object.assign({
                success: true,
                failure: undefined
            }, Object.assign(Object.assign({
                clientWorkerId: PerformanceTester.getClientWorkerId(),
                worker: PerformanceTester.getProcessId(),
                platform: PerformanceTester.browser?.sessionId,
                testName: PerformanceTester.scenarioThatRan?.pop()
            }, detailsWithContext), this.details[label] || {}))

            return returnVal
        } catch (er) {
            performance.mark(endMark)
            performance.measure(label, startMark, endMark)

            this.details[label] = Object.assign({
                success: false,
                failure: util.format(er)
            }, Object.assign(Object.assign({
                clientWorkerId: PerformanceTester.getClientWorkerId(),
                worker: PerformanceTester.getProcessId(),
                platform: PerformanceTester.browser?.sessionId,
                testName: PerformanceTester.scenarioThatRan?.pop()
            }, detailsWithContext), this.details[label] || {}))

            throw er
        }
    }

    static start(event: string) {
        const finalEvent = event + '-start'
        if (this.eventsMap[finalEvent]) {return}
        performance.mark(finalEvent)
        this.eventsMap[finalEvent] = 1
    }

    static end(event: string, success = true, failure?: string | unknown, details = {}) {
        performance.mark(event + '-end')
        performance.measure(event, event + '-start', event + '-end')
        this.details[event] = Object.assign({ success, failure: util.format(failure) }, Object.assign(Object.assign({
            clientWorkerId: PerformanceTester.getClientWorkerId(),
            worker: PerformanceTester.getProcessId(),
            platform: PerformanceTester.browser?.sessionId,
            testName: PerformanceTester.scenarioThatRan && PerformanceTester.scenarioThatRan[PerformanceTester.scenarioThatRan.length - 1]
        }, details), this.details[event] || {}))
    }

    /**
     * Get client worker ID in format "threadId-processId".
     * This method provides a consistent identifier across the SDK for tracking
     * worker-specific events and performance metrics.
     *
     * @returns Worker ID string in format "threadId-processId"
     */
    static getClientWorkerId(): string {
        return CLIUtils.getClientWorkerId()
    }

    static getProcessId() {
        return `${process.pid}-${worker.threadId}`
    }

    static sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

    /**
     * Upload SDK events to EDS and write to event_sdk.json for binary to read.
     *
     * Architecture:
     * - SDK tracks all events with clientWorkerId
     * - SDK writes only event_sdk.json (SDK events filtered by SDK_EVENTS_LIST)
     * - SDK sends clientWorkerId via gRPC to binary
     * - Binary reads event_sdk.json and writes event_cli.json + event_requests.json
     * - SDK uploads SDK events to EDS for analytics
     */
    static async uploadEventsData() {
        // Track overall key metrics operation
        this.start(EVENTS.SDK_SEND_KEY_METRICS)

        try {
            const workerId = `${process.pid}`
            BStackLogger.debug(`[Performance Upload] Starting upload for worker ${workerId}`)

            // Track preparation phase (collection and deduplication)
            this.start(EVENTS.SDK_KEY_METRICS_PREPARATION)

            // Collect all measures from performance report files and in-memory events
            let measures: any[] = []
            if (await fsPromise.access(this.jsonReportDirPath).then(() => true).catch(() => false)) {
                const files = (await fsPromise.readdir(this.jsonReportDirPath)).map(file => path.resolve(this.jsonReportDirPath, file))
                measures = (await Promise.all(files.map((file) => fsPromise.readFile(file, 'utf-8')))).map(el => `[${el.slice(0, -1)}]`).map(el => JSON.parse(el)).flat()
            }
            BStackLogger.debug(`[Performance Upload] Total events from files: ${measures.length}`)

            if (this._measuredEvents.length > 0) {
                BStackLogger.debug(`[Performance Upload] Adding ${this._measuredEvents.length} in-memory events`)
                measures = measures.concat(this._measuredEvents)
            }
            const ensureEpochTimes = (arr: any[]) => {
                const now = Date.now()
                const cutoff = 1e12 // ~year 2001, ms epoch
                const timeOrigin = (
                    typeof performance !== 'undefined' && typeof performance.timeOrigin === 'number'
                )
                    ? performance.timeOrigin
                    : (now - process.uptime() * 1000)
                return arr.map(entry => {
                    if (typeof entry.startTime === 'number' && entry.startTime < cutoff) {
                        entry.startTime = timeOrigin + entry.startTime
                    }
                    return entry
                })
            }
            measures = ensureEpochTimes(measures)
            const date = new Date()
            // yyyy-MM-dd'T'HH:mm:ss.SSSSSS Z
            const options: Intl.DateTimeFormatOptions = {
                timeZone: 'UTC',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                fractionalSecondDigits: 3, // To include microseconds
                hour12: false
            }
            // Format the date and replace the default separator for time zone
            const formattedDate = new Intl.DateTimeFormat('en-GB', options)
                .formatToParts(date)
                .map(({ type, value }) => type === 'timeZoneName' ? 'Z' : value)
                .join('')
                .replace(',', 'T')


            // Write SDK events to event_sdk.json for binary to read
            //await this.prepareAndWriteEventFiles(measures)

            this.end(EVENTS.SDK_KEY_METRICS_PREPARATION, true)
            const payload = {
                event_type: 'sdk_events',
                data: {
                    testhub_uuid: process.env.PERF_TESTHUB_UUID || process.env.SDK_RUN_ID,
                    created_day: formattedDate,
                    event_name: 'SDKFeaturePerformance',
                    user_data: process.env.PERF_USER_NAME,
                    host_info: JSON.stringify({
                        hostname: hostname(),
                        platform: platform(),
                        type: type(),
                        version: version(),
                        arch: arch()
                    }),
                    event_json: { measures: measures, sdkRunId: process.env.SDK_RUN_ID }
                }
            }
            const result = await fetchWrap(`${APIUtils.EDS_URL}/send_sdk_events`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            BStackLogger.debug(`[Performance Upload] Successfully uploaded to EDS: ${util.format(await result.text())}`)

            this.end(EVENTS.SDK_KEY_METRICS_UPLOAD, true)
            this.end(EVENTS.SDK_SEND_KEY_METRICS, true)
        } catch (er) {
            BStackLogger.debug(`[Performance Upload] Failed to upload events: ${util.format(er)}`)
            this.end(EVENTS.SDK_KEY_METRICS_UPLOAD, false, er)
            this.end(EVENTS.SDK_KEY_METRICS_PREPARATION, false, er)
            this.end(EVENTS.SDK_SEND_KEY_METRICS, false, er)
        }

        try {
            if (await fsPromise.access(this.jsonReportDirPath).then(() => true, () => false)) {
                const files = await fsPromise.readdir(this.jsonReportDirPath)

                for (const file of files) {
                    await fsPromise.unlink(path.join(this.jsonReportDirPath, file))
                }

                BStackLogger.debug(`[Performance Upload] Cleaned up ${files.length} temporary report files`)
            }
        } catch (er) {
            BStackLogger.debug(`[Performance Upload] Failed to delete temporary files: ${util.format(er)}`)
        }
    }

    /**
     * Write only SDK-specific events to event_sdk.json.
     * SDK events are those that match SDK_EVENTS_LIST.
     *
     * The binary handles writing:
     * - event_cli.json (all non-request events including SDK events)
     * - event_requests.json (HTTP request events)
     *
     * The binary receives clientWorkerId via gRPC and uses it to categorize
     * and write events to the appropriate files.
     */
    private static async prepareAndWriteEventFiles(measures: any[]) {
        try {

            const sdkMeasures = measures.filter((entry) => this.isSDKEvent(entry.name))

            if (sdkMeasures.length === 0) {
                BStackLogger.debug('[prepareAndWriteEventFiles] No SDK events to write')
                return
            }

            BStackLogger.debug(`[prepareAndWriteEventFiles] Filtered ${sdkMeasures.length} SDK events before deduplication`)

            // const sdkEventProperties = {
            //     measures: sdkMeasures.map(entry => {
            //         // Clean up null detail fields
            //         const entryAny = entry as any
            //         if (entryAny.detail === null) {
            //             delete entryAny.detail
            //         }
            //         return entryAny
            //     })
            // }

            // Ensure directory exists
            // const dir = path.dirname(this.sdkEventsFileName)
            // if (!fs.existsSync(dir)) {
            //     await fsPromise.mkdir(dir, { recursive: true })
            // }

            // Write SDK events to event_sdk.json
            // await fsPromise.writeFile(
            //     this.sdkEventsFileName,
            //     JSON.stringify(sdkEventProperties, null, 2),
            //     'utf-8'
            // )

            // BStackLogger.debug(`[prepareAndWriteEventFiles] Wrote ${deduplicatedSdkMeasures.length} SDK events to ${this.sdkEventsFileName}`)
            // BStackLogger.debug(`[prepareAndWriteEventFiles] SDK events written: ${deduplicatedSdkMeasures.map(m => m.name).join(', ')}`)
        } catch (error) {
            BStackLogger.debug(`[prepareAndWriteEventFiles] Error writing SDK event file: ${util.format(error)}`)
        }
    }

    /**
 * Check if an event name matches any pattern in SDK_EVENTS_LIST.
 * Supports exact matching and prefix matching (for events with unique suffixes).
 *
 * @param eventName - The event name to check
 * @returns true if the event should be included in SDK events
 */
    private static isSDKEvent(eventName: string): boolean {
    // First try exact match (fast path for most events)
        if (SDK_EVENTS_LIST.includes(eventName)) {
            return true
        }

        return SDK_EVENTS_LIST.some(sdkEvent => eventName.startsWith(`${sdkEvent}-`))
    }
}
