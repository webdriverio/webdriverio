import fs from 'node:fs'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import { transformAsync as babelTransform } from '@babel/core'
import babelPluginIstanbul from 'babel-plugin-istanbul'
import libCoverage from 'istanbul-lib-coverage'
import libReport from 'istanbul-lib-report'
import reports from 'istanbul-reports'

import logger from '@wdio/logger'

import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/common/Connection.js'

import type { CoverageReporterOptions, Coverage } from '../types.js'

const log = logger('@wdio/devtools-service:CoverageGatherer')

const MAX_WAIT_RETRIES = 10
const CAPTURE_INTERVAL = 1000
const DEFAULT_REPORT_TYPE = 'json'
const DEFAULT_REPORT_DIR = path.join(process.cwd(), 'coverage')

export default class CoverageGatherer extends EventEmitter {
    private _coverageLogDir: string
    private _coverageMap?: libCoverage.CoverageMap
    private _captureInterval?: NodeJS.Timeout
    private _client?: CDPSession

    constructor (private _page: Page, private _options: CoverageReporterOptions) {
        super()
        this._coverageLogDir = path.resolve(process.cwd(), this._options.logDir || DEFAULT_REPORT_DIR)
        this._page.on('load', this._captureCoverage.bind(this))
    }

    async init () {
        this._client = await this._page.target().createCDPSession()

        await this._client.send('Fetch.enable', {
            patterns: [{ requestStage: 'Response' }]
        })

        this._client.on(
            'Fetch.requestPaused',
            this._handleRequests.bind(this)
        )
    }

    private async _handleRequests (event: any) {
        const { requestId, request, responseStatusCode = 200 } = event

        if (!this._client) {
            return
        }

        /**
         * continue with requests that aren't JS files
         */
        let skipCoverageFlag = false
        if (!request.url.endsWith('.js')) {
            skipCoverageFlag = true
        }

        /**
         * continue with requests that are part of exclude patterns
         */
        if (this._options.exclude){
            for (const excludeFile of this._options.exclude){
                if (request.url.match(excludeFile)){
                    skipCoverageFlag = true
                    break
                }
            }
        }

        if (skipCoverageFlag){
            return this._client.send(
                'Fetch.continueRequest',
                { requestId }
            ).catch(/* istanbul ignore next */ (err: Error) => log.debug(err.message))
        }

        /**
         * fetch original response
         */
        const { body, base64Encoded } = await this._client.send(
            'Fetch.getResponseBody',
            { requestId })
        const inputCode = base64Encoded ? Buffer.from(body, 'base64').toString('utf8') : body

        const url = new URL(request.url)
        const fullPath = path.join(this._coverageLogDir, 'files', url.hostname, url.pathname)
        const dirPath = path.dirname(fullPath)

        /**
         * create dir if not existing
         */
        if (!fs.existsSync(dirPath)) {
            await fs.promises.mkdir(dirPath, { recursive: true })
        }

        await fs.promises.writeFile(fullPath, inputCode, 'utf-8')
        try {
            const result = await babelTransform(inputCode, {
                auxiliaryCommentBefore: ' istanbul ignore next ',
                babelrc: false,
                caller: {
                    name: '@wdio/devtools-service'
                },
                configFile: false,
                filename: path.join(url.hostname, url.pathname),
                plugins: [
                    [
                        babelPluginIstanbul,
                        {
                            compact: false,
                            exclude: [],
                            extension: false,
                            useInlineSourceMaps: false,
                        },
                    ],
                ],
                sourceMaps: false
            })

            return this._client.send('Fetch.fulfillRequest', {
                requestId,
                responseCode: responseStatusCode,
                /** do not mock body if it's undefined */
                body: !result ? undefined : Buffer.from(result.code!, 'utf8').toString('base64')
            })
        } catch (err: any) {
            log.warn(`Couldn't instrument file due to: ${err.stack}`)
            return this._client.send('Fetch.fulfillRequest', {
                requestId,
                responseCode: responseStatusCode,
                body: inputCode
            })
        }
    }

    private _clearCaptureInterval () {
        if (!this._captureInterval) {
            return
        }

        clearInterval(this._captureInterval)
        delete this._captureInterval
    }

    private _captureCoverage () {
        if (this._captureInterval) {
            this._clearCaptureInterval()
        }

        this._captureInterval = setInterval(async () => {
            log.info('capturing coverage data')

            try {
                const globalCoverageVar = await this._page.evaluate(
                    /* istanbul ignore next */
                    () => window['__coverage__' as any]) as any as libCoverage.CoverageMapData

                this._coverageMap = libCoverage.createCoverageMap(globalCoverageVar)
                log.info(`Captured coverage data of ${this._coverageMap.files().length} files`)
            } catch (err: any) {
                log.warn(`Couldn't capture data: ${err.message}`)
                this._clearCaptureInterval()
            }
        }, CAPTURE_INTERVAL)
    }

    async _getCoverageMap (retries = 0): Promise<libCoverage.CoverageMap> {
        /* istanbul ignore if */
        if (retries > MAX_WAIT_RETRIES) {
            return Promise.reject(new Error('Couldn\'t capture coverage data for page'))
        }

        if (!this._coverageMap) {
            log.info('No coverage data collected, waiting...')
            await new Promise((resolve) => setTimeout(resolve, CAPTURE_INTERVAL))
            return this._getCoverageMap(++retries)
        }

        return this._coverageMap
    }

    async logCoverage (): Promise<void> {
        this._clearCaptureInterval()

        // create a context for report generation
        const coverageMap = await this._getCoverageMap()
        const context = libReport.createContext({
            dir: this._coverageLogDir,
            // The summarizer to default to (may be overridden by some reports)
            // values can be nested/flat/pkg. Defaults to 'pkg'
            defaultSummarizer: 'nested',
            coverageMap,
            sourceFinder: (source: string) => {
                const f = fs.readFileSync(path.join(this._coverageLogDir, 'files', source.replace(process.cwd(), '')))
                return f.toString('utf8')
            }
        })

        // create an instance of the relevant report class, passing the
        // report name e.g. json/html/html-spa/text
        const report = reports.create(
            this._options.type || DEFAULT_REPORT_TYPE,
            this._options.options
        )

        // call execute to synchronously create and write the report to disk
        // @ts-ignore
        report.execute(context)
    }

    async getCoverageReport (): Promise<Coverage | null> {
        const files: Record<string, libCoverage.CoverageSummary> = {}
        const coverageMap = await this._getCoverageMap()
        const summary = libCoverage.createCoverageSummary()
        for (const f of coverageMap.files()) {
            const fc = coverageMap.fileCoverageFor(f)
            const s = fc.toSummary()
            files[f] = s
            summary.merge(s)
        }

        return {
            ...summary.data,
            files: Object.entries(files).reduce((obj, [filename, { data }]) => {
                obj[filename.replace(process.cwd(), '')] = data
                return obj
            }, {} as Record<string, libCoverage.CoverageSummaryData>)
        }
    }
}
