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
import { EDS_URL, PERF_MEASUREMENT_ENV } from '../../constants.js'
import fetchWrap from '../../fetchWrapper.js'
import type { CsvWriter } from 'csv-writer/src/lib/csv-writer.js'
import type { ObjectMap } from 'csv-writer/src/lib/lang/object.js'
import type { Browser } from 'webdriverio'

type PerformanceDetails = {
    success?: true,
    failure?: string,
    testName?: string,
    worker?: string | number,
    command?: string,
    hookType?: string,
    platform?: string | number
}

export default class PerformanceTester {
    static _observer: PerformanceObserver
    static _csvWriter: CsvWriter<ObjectMap<{}>>
    private static _events: PerformanceEntry[] = []
    private static _measuredEvents: PerformanceEntry[] = []
    static started = false
    static details: { [key: string]: PerformanceDetails } = {}
    static eventsMap: { [key: string]: number } = {}
    static browser?: Browser
    static scenarioThatRan: string[]
    static jsonReportDirName = 'performance-report'
    static jsonReportDirPath = path.join(process.cwd(), 'logs', this.jsonReportDirName)
    static jsonReportFileName = `${this.jsonReportDirPath}/performance-report-${PerformanceTester.getProcessId()}.json`

    static startMonitoring(csvName: string = 'performance-report.csv') {
        // Create performance-report dir if not exists already
        if (!fs.existsSync(this.jsonReportDirPath)) {
            fs.mkdirSync(this.jsonReportDirPath, { recursive: true })
        }
        this._observer = new PerformanceObserver(list => {
            list.getEntries()
                .filter((entry) => entry.entryType === 'measure')
                .forEach(entry => {
                    let finalEntry = entry
                    finalEntry = entry.toJSON()
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

        await PerformanceTester.sleep(2000) // Wait to 2s just to finish any running callbacks for timerify

        this.started = false

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

        PerformanceTester.start(label)
        if (this.details) {
            (this.details[label] = details)
        }
        try {
            const returnVal = fn.apply(thisArg, args)
            if (returnVal instanceof Promise) {
                return new Promise((resolve, reject) => {
                    returnVal
                        .then(v => {
                            PerformanceTester.end(label)
                            resolve(v)
                        }).catch(e => {
                            PerformanceTester.end(label, false, util.format(e))
                            reject(e)
                        })
                })
            }
            PerformanceTester.end(label)
            return returnVal
        } catch (er) {
            PerformanceTester.end(label, false, util.format(er))
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
            worker: PerformanceTester.getProcessId(),
            platform: PerformanceTester.browser?.sessionId,
            testName: PerformanceTester.scenarioThatRan && PerformanceTester.scenarioThatRan[PerformanceTester.scenarioThatRan.length - 1]
        }, details), this.details[event] || {}))
    }

    static getProcessId() {
        return `${process.pid}-${worker.threadId}`
    }

    static sleep = (ms = 100) => new Promise((resolve) => setTimeout(resolve, ms))

    static async uploadEventsData() {
        try {
            let measures = []
            if (await fsPromise.access(this.jsonReportDirPath).then(() => true).catch(() => false)) {
                const files = (await fsPromise.readdir(this.jsonReportDirPath)).map(file => path.resolve(this.jsonReportDirPath, file))
                measures = (await Promise.all(files.map((file) => fsPromise.readFile(file, 'utf-8')))).map(el => `[${el.slice(0, -1)}]`).map(el => JSON.parse(el)).flat()
            }

            if (this._measuredEvents.length > 0) {
                measures = measures.concat(this._measuredEvents)
            }

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
            const result = await fetchWrap(`${EDS_URL}/send_sdk_events`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            BStackLogger.debug(`Successfully uploaded performance events ${util.format(await result.text())}`)
        } catch (er) {
            BStackLogger.debug(`Failed to upload performance events ${util.format(er)}`)
        }

        try {
            if (await fsPromise.access(this.jsonReportDirPath).then(() => true, () => false)) {
                const files = await fsPromise.readdir(this.jsonReportDirPath)

                for (const file of files) {
                    await fsPromise.unlink(path.join(this.jsonReportDirPath, file))
                }
            }
        } catch (er) {
            BStackLogger.debug(`Failed to delete performance related files ${util.format(er)}`)
        }

    }
}
