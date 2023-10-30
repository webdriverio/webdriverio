import { createObjectCsvWriter } from 'csv-writer'
import fs from 'node:fs'
import { performance, PerformanceObserver } from 'node:perf_hooks'
import { sleep } from './util.js'
import { BStackLogger } from './bstackLogger.js'

export default class PerformanceTester {
    static _observer: PerformanceObserver
    static _csvWriter: any
    private static _events: PerformanceEntry[] = []
    static started = false

    static startMonitoring(csvName: string = 'performance-report.csv') {
        this._observer = new PerformanceObserver(list => {
            list.getEntries().forEach(entry => {
                this._events.push(entry)
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
}
