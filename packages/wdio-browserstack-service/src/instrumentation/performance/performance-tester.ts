import { createObjectCsvWriter } from 'csv-writer'
import fs from 'node:fs'
import { performance, PerformanceObserver } from 'node:perf_hooks'
import util from 'node:util'
const worker = require('node:worker_threads')

import { sleep } from '../../util.js'
import { BStackLogger } from '../../bstackLogger.js'

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
    static _csvWriter: any
    private static _events: PerformanceEntry[] = []
    static started = false
    static details: {[key: string]: PerformanceDetails} = {}
    static eventsMap: {[key: string]: number} = {}
    static browser?: WebdriverIO.Browser
    static scenarioThatRan: string[]

    static startMonitoring(csvName: string = 'performance-report.csv') {
        this._observer = new PerformanceObserver(list => {
            list.getEntries().forEach(entry => {
                let finalEntry = entry
                if (entry.entryType === 'measure') {
                    finalEntry = entry.toJSON()
                    if (this.details[entry.name]) {
                        finalEntry = Object.assign(finalEntry, this.details[entry.name])
                    }

                    delete this.details[entry.name]
                }
                this._events.push(finalEntry)
            })
        })
        this._observer.observe({ buffered: true, entryTypes: ['function'] })
        this.started = true
        this._csvWriter = createObjectCsvWriter({
            path: csvName,
            header: [
                { id: 'name', title: 'Function Name' },
                { id: 'time', title: 'Execution Time (ms)' }
            ]
        })
    }

    static getPerformance() {
        return performance
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
        BStackLogger.info(`Time for ${methods} is ${timeTaken}`)
        return timeTaken
    }

    static async stopAndGenerate(filename: string = 'performance-own.html') {
        if (!this.started) {return}

        await sleep(2000) // Wait to 2s just to finish any running callbacks for timerify
        this._observer.disconnect()
        this.started = false

        this.generateCSV(this._events)

        const content = this.generateReport(this._events)
        const path = process.cwd() + '/' + filename
        fs.writeFile(path, content, err => {
            if (err) {
                BStackLogger.error(`Error in writing html ${err}`)
                return
            }
            BStackLogger.info(`Performance report is at ${path}`)
        })
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
            .catch((error: any) => console.error(error))
    }

    static Measure(label: string, details: PerformanceDetails = {}) {
        return (
            target: Object,
            key: string | symbol,
            descriptor: TypedPropertyDescriptor<any>) => {
            const originalMethod = descriptor.get
            descriptor.get = function() {
                return PerformanceTester.measure.apply(this, [label, originalMethod as Function, { methodName: key.toString(), ...details }, arguments])
            }
        }
    }

    static measureWrapper(name: string, fn: Function, details: PerformanceDetails = {}) {
        const self = this

        details.worker = PerformanceTester.getProcessId()
        details.testName = PerformanceTester.scenarioThatRan?.pop()
        details.platform = PerformanceTester.browser?.sessionId

        return function () {
            const args = [name, fn, details, arguments]

            return self.measure.apply(self, args as [string, Function, {}, IArguments?])
        }

    }

    static isEnabled() {
        return !(process.env.BROWSERSTACK_SDK_INSTRUMENTATION === 'false')
    }

    static measure(label: string, fn: Function, details = {}, args?: IArguments) {
        try {
            if (this.started && this.isEnabled()) {
                PerformanceTester.start(label)
                this.details && (this.details[label] = details)

                try {
                    const returnVal = fn.apply(null, args)
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

            return fn.apply(null, args)
        } catch (err) {
            return fn.apply(null, args)
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
            testName: PerformanceTester.scenarioThatRan?.pop()
        }, details), this.details[event] || {}))
    }

    static getProcessId() {
        return `${process.pid}-${worker.threadId}`
    }
}
