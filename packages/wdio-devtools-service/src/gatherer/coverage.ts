import fs from 'fs'
import path from 'path'
import cp from 'child_process'
import { EventEmitter } from 'events'
import axios from 'axios'
import { promisify } from 'util'

import logger from '@wdio/logger'

import type { Page } from 'puppeteer-core/lib/cjs/puppeteer/common/Page'
import type { HTTPRequest } from 'puppeteer-core/lib/cjs/puppeteer/common/HTTPRequest'

const log = logger('@wdio/devtools-service:CoverageGatherer')
const CAPTURE_INTERVAL = 1000
const COVERAGE_FILENAME = 'wdio-coverage-all.json'

export default class CoverageGatherer extends EventEmitter {
    private _coverageLogDir: string
    private _coverage: any = {}
    private _capturedData = false
    private _captureInterval?: NodeJS.Timeout

    constructor (private _page: Page, coverageLogDir: string) {
        super()
        this._coverageLogDir = path.resolve(process.cwd(), coverageLogDir)
        this._capturedData = false

        this._page.on('request', this._handleRequests.bind(this))
        this._page.on('load', this._captureCoverage.bind(this))
        this._page.setRequestInterception(true)
    }

    private async _handleRequests (req: HTTPRequest) {
        const requestUrl = req.url()

        if (!requestUrl.endsWith('.js')) {
            return req.continue()
        }

        const source = await axios.get(requestUrl)
        const fullPath = this._storeSourceFile(requestUrl, source.data)
        const nyc = cp.spawn(`nyc instrument ${fullPath}`)
        return nyc.stdout.pipe(req as any)
    }

    private _storeSourceFile (requestUrl: string, source: string) {
        const url = new URL(requestUrl)
        const fullPath = path.join(this._coverageLogDir, 'files', url.hostname, url.pathname)
        const dirPath = path.dirname(fullPath)

        /**
         * create dir if not existing
         */
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true })
        }

        fs.writeFileSync(fullPath, source, 'utf8')
        return fullPath
    }

    private _clearCaptureInterval () {
        if (!this._captureInterval) {
            return
        }

        clearInterval(this._captureInterval)
        delete this._captureInterval
    }

    private _captureCoverage () {
        this._capturedData = false

        if (this._captureInterval) {
            this._clearCaptureInterval()
        }

        this._captureInterval = setInterval(async () => {
            log.info('capturing coverage data')

            try {
                const pageCoverage = await this._page.evaluate(
                    // eslint-disable-next-line no-undef
                    () => window['__coverage__' as any])

                this._capturedData = true
                log.info(`Captured coverage data of ${Object.entries(pageCoverage).length} files`)
                this._coverage = pageCoverage
            } catch (e) {
                log.warn(`Couldn't capture data: ${e.message}`)
                this._clearCaptureInterval()
            }
        }, CAPTURE_INTERVAL)
    }

    async logCoverage (): Promise<void> {
        if (!this._coverageLogDir) {
            return
        }

        /**
         * if no coverage data was captured yet, wait until it was
         */
        if (!this._capturedData) {
            log.info('No coverage data collected, waiting...')
            await new Promise((resolve) => setTimeout(resolve, CAPTURE_INTERVAL))
            return this.logCoverage()
        }

        this._clearCaptureInterval()
        const filename = path.join(this._coverageLogDir, COVERAGE_FILENAME)
        log.info(`Store coverage log file at ${filename}`)
        const data = Object.values(this._coverage)
            .map((coverageData: any) => {
                const url = new URL(coverageData.path)
                const fullPath = path.join(this._coverageLogDir, 'files', url.hostname, url.pathname)
                coverageData.path = fullPath
                return [fullPath, coverageData]
            })
            .reduce((obj, [path, coverageData]) => {
                obj[path] = coverageData
                return obj
            }, {} as any)
        await promisify(fs.writeFile)(filename, JSON.stringify(data), 'utf8')
    }
}
