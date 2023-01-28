import fs from 'node:fs/promises'
import path from 'node:path'

import logger from '@wdio/logger'
import type { RunArgs, WorkerInstance } from '@wdio/local-runner'
import LocalRunner from '@wdio/local-runner'
import { attach } from 'webdriverio'
import libCoverage, { type CoverageMapData } from 'istanbul-lib-coverage'
import libReport from 'istanbul-lib-report'
import libSourceMap from 'istanbul-lib-source-maps'
import reports from 'istanbul-reports'

import type { SessionStartedMessage, SessionEndedMessage, WorkerHookResultMessage } from '@wdio/runner'
import type { Options } from '@wdio/types'

import { ViteServer } from './vite/server.js'
import { FRAMEWORK_SUPPORT_ERROR, SESSIONS, BROWSER_POOL, DEFAULT_COVERAGE_REPORTS, SUMMARY_REPORTER } from './constants.js'
import { makeHeadless, getCoverageByFactor } from './utils.js'
import type { HookTriggerEvent } from './vite/types.js'
import type { BrowserRunnerOptions as BrowserRunnerOptionsImport } from './types.js'

const log = logger('@wdio/browser-runner')
export default class BrowserRunner extends LocalRunner {
    #config: Options.Testrunner
    #server: ViteServer

    constructor(
        private options: BrowserRunnerOptionsImport,
        protected _config: Options.Testrunner
    ) {
        super(options as never, _config)

        if (_config.framework !== 'mocha') {
            throw new Error(FRAMEWORK_SUPPORT_ERROR)
        }

        this.#server = new ViteServer(options, _config)
        this.#config = _config
    }

    /**
     * nothing to initialise when running locally
     */
    async initialise() {
        log.info('Initiate browser environment')
        try {
            await this.#server.start()
            this._config.baseUrl = `http://localhost:${this.#server.config.server?.port}`
        } catch (err: any) {
            throw new Error(`Vite server failed to start: ${err.stack}`)
        }

        await super.initialise()
    }

    run (runArgs: RunArgs): WorkerInstance {
        runArgs.caps = makeHeadless(this.options, runArgs.caps)

        if (runArgs.command === 'run') {
            runArgs.args.baseUrl = this._config.baseUrl
        }

        const worker = super.run(runArgs)
        this.#server.on('debugState', (state: boolean) => worker.postMessage('switchDebugState', state))
        this.#server.on('workerHookExecution', (payload: HookTriggerEvent) => {
            if (worker.cid !== payload.cid) {
                return
            }
            return worker.postMessage('workerHookExecution', payload)
        })
        worker.on('message', async (payload: SessionStartedMessage | SessionEndedMessage | WorkerHookResultMessage) => {
            if (payload.name === 'sessionStarted' && !SESSIONS.has(payload.cid!)) {
                SESSIONS.set(payload.cid!, {
                    args: this.#config.mochaOpts || {},
                    config: this.#config,
                    capabilities: payload.content.capabilities,
                    sessionId: payload.content.sessionId,
                    injectGlobals: payload.content.injectGlobals
                })
                const browser = await attach({
                    ...this.#config,
                    ...payload.content,
                    options: {
                        ...this.#config,
                        ...payload.content
                    }
                })
                /**
                 * propagate debug state to the worker
                 */
                BROWSER_POOL.set(payload.cid!, browser)
            }

            if (payload.name === 'sessionEnded') {
                SESSIONS.delete(payload.cid)
                BROWSER_POOL.delete(payload.cid)
            }

            if (payload.name === 'workerHookResult') {
                this.#server.resolveHook(payload.args)
            }
        })

        return worker
    }

    /**
     * shutdown vite server
     *
     * @return {Promise}  resolves when vite server has been shutdown
     */
    async shutdown() {
        await super.shutdown()
        await this.#server.close()
        return this._generateCoverageReports()
    }

    private async _generateCoverageReports () {
        if (!this.options.coverage?.enabled) {
            return true
        }

        const coverageIssues: string[] = []
        try {
            const reportsDirectory = this.options.coverage.reportsDirectory || path.join(this.#config.rootDir!, '.coverage')
            const globalCoverageVar: CoverageMapData = JSON.parse((await fs.readFile(path.join(reportsDirectory, 'out.json'))).toString())
            const mapStore = libSourceMap.createSourceMapStore()
            const coverageMap = await mapStore.transformCoverage(libCoverage.createCoverageMap(globalCoverageVar))
            const context = libReport.createContext({
                dir: reportsDirectory,
                defaultSummarizer: 'nested',
                coverageMap
            })

            const reporter = this.options.coverage.reporter
                ? Array.isArray(this.options.coverage.reporter) ? this.options.coverage.reporter : [this.options.coverage.reporter]
                : DEFAULT_COVERAGE_REPORTS

            /**
             * ensure summary reporter is set as we need it for treshold comparison
             */
            if (!reporter.includes(SUMMARY_REPORTER)) {
                reporter.push(SUMMARY_REPORTER)
            }

            const reportBases = reporter.map((r) => reports.create(r, {
                projectRoot: this.#config.rootDir,
                subdir: 'html'
            }))
            reportBases.map((reportBase) => reportBase.execute(context))
            log.info(`Successfully created coverage reports for ${reporter.join(', ')}`)

            const summaryFilePath = path.join(reportsDirectory, 'coverage-summary.json')
            const summary = JSON.parse((await fs.readFile(summaryFilePath)).toString())
            coverageIssues.push(
                ...this.options.coverage.perFile
                    ? Object.entries(summary)
                        .filter(([source]) => source !== 'total')
                        .map(([source, summary]: any) => (
                            getCoverageByFactor(this.options.coverage!, summary, source.replace(this.#config.rootDir, '')))
                        )
                        .flat()
                    : getCoverageByFactor(this.options.coverage!, summary.total)
            )
        } catch (err: unknown) {
            console.error(`Failed to generate code coverage report: ${(err as Error).message}`)
            return false
        }

        if (coverageIssues.length) {
            console.log(coverageIssues.join('\n'))
            return false
        }

        return true
    }
}

declare global {
    namespace WebdriverIO {
        interface BrowserRunnerOptions extends BrowserRunnerOptionsImport {}
    }
}
