import fs from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'

import logger from '@wdio/logger'
import LocalRunner from '@wdio/local-runner'
import { attach } from 'webdriverio'
import libCoverage, { type CoverageMap, type CoverageMapData } from 'istanbul-lib-coverage'
import libReport from 'istanbul-lib-report'
import libSourceMap from 'istanbul-lib-source-maps'
import reports from 'istanbul-reports'

import type { RunArgs, WorkerInstance } from '@wdio/local-runner'
import type { SessionStartedMessage, SessionEndedMessage, WorkerHookResultMessage, WorkerCoverageMapMessage } from '@wdio/runner'
import type { Options } from '@wdio/types'
import type { MaybeMocked, MaybeMockedDeep, MaybePartiallyMocked, MaybePartiallyMockedDeep } from '@vitest/spy'
import type { InlineConfig } from 'vite'

import { ViteServer } from './vite/server.js'
import {
    FRAMEWORK_SUPPORT_ERROR, SESSIONS, BROWSER_POOL, DEFAULT_COVERAGE_REPORTS, SUMMARY_REPORTER,
    DEFAULT_REPORTS_DIRECTORY
} from './constants.js'
import updateViteConfig from './vite/frameworks/index.js'
import { makeHeadless, getCoverageByFactor, adjustWindowInWatchMode } from './utils.js'
import type { HookTriggerEvent } from './vite/types.js'
import type { BrowserRunnerOptions as BrowserRunnerOptionsImport, CoverageOptions, MockFactoryWithHelper } from './types.js'

const log = logger('@wdio/browser-runner')
type WorkerMessagePayload = SessionStartedMessage | SessionEndedMessage | WorkerHookResultMessage | WorkerCoverageMapMessage

export default class BrowserRunner extends LocalRunner {
    #options: BrowserRunnerOptionsImport
    #config: Options.Testrunner
    #servers: Set<ViteServer> = new Set()
    #coverageOptions: CoverageOptions
    #reportsDirectory: string
    #viteOptimizations: InlineConfig = {}

    #mapStore = libSourceMap.createSourceMapStore()
    private _coverageMaps: CoverageMap[] = []

    constructor(
        private options: BrowserRunnerOptionsImport,
        protected _config: Options.Testrunner
    ) {
        super(options as never, _config)

        if (_config.framework !== 'mocha') {
            throw new Error(FRAMEWORK_SUPPORT_ERROR)
        }

        this.#options = options
        this.#config = _config
        this.#coverageOptions = options.coverage || <CoverageOptions>{}
        this.#reportsDirectory = this.#coverageOptions.reportsDirectory || path.join(this.#config.rootDir!, DEFAULT_REPORTS_DIRECTORY)

        /**
         * transform mochaOpts require params so we can use it in the browser
         */
        if (this.#config.mochaOpts) {
            this.#config.mochaOpts.require = (this.#config.mochaOpts.require || [])
                .map((r) => path.join(this.#config.rootDir || process.cwd(), r))
                .map((r) => url.pathToFileURL(r).pathname)
        }
    }

    /**
     * nothing to initialize when running locally
     */
    async initialize() {
        log.info('Initiate browser environment')
        if (typeof this.#coverageOptions.clean === 'undefined' || this.#coverageOptions.clean) {
            const reportsDirectoryExist = await fs.access(this.#reportsDirectory)
                .then(() => true, () => false)
            if (reportsDirectoryExist) {
                await fs.rm(this.#reportsDirectory, { recursive: true })
            }
        }

        /**
         * make adjustments based on detected frontend frameworks
         */
        try {
            this.#viteOptimizations = await updateViteConfig(this.#options, this.#config)
        } catch (err) {
            log.error(`Failed to optimize Vite config: ${(err as Error).stack}`)
        }

        await super.initialize()
    }

    async run (runArgs: RunArgs): Promise<WorkerInstance> {
        runArgs.caps = makeHeadless(this.options, runArgs.caps)
        runArgs.caps = adjustWindowInWatchMode(this.#config, runArgs.caps)

        const server = new ViteServer(this.#options, this.#config, this.#viteOptimizations)

        try {
            await server.start()
            runArgs.args.baseUrl = `http://localhost:${server.config.server?.port}`
        } catch (err: any) {
            throw new Error(`Vite server failed to start: ${err.stack}`)
        }

        if (!runArgs.args.baseUrl && runArgs.command === 'run') {
            runArgs.args.baseUrl = this._config.baseUrl
        }

        const worker = await super.run(runArgs)
        server.on('debugState', (state: boolean) => worker.postMessage('switchDebugState', state, true))
        server.on('workerHookExecution', (payload: HookTriggerEvent) => {
            if (worker.cid !== payload.cid) {
                return
            }
            if (worker.isKilled) {
                log.debug(`Worker with cid ${payload.cid} was killed, skipping hook execution`)
                return process.nextTick(() => server.resolveHook(payload))
            }
            return worker.postMessage('workerHookExecution', payload, true)
        })

        worker.on('message', (payload: WorkerMessagePayload) => this.#onWorkerMessage(payload, server))
        return worker
    }

    /**
     * shutdown vite server
     *
     * @return {Promise}  resolves when vite server has been shutdown
     */
    async shutdown() {
        await super.shutdown()
        for (const server of this.#servers) {
            await server.close()
        }
        return this._generateCoverageReports()
    }

    async #onWorkerMessage (payload: WorkerMessagePayload, workerServer: ViteServer) {
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
            workerServer.resolveHook(payload.args)
        }

        if (payload.name === 'coverageMap') {
            const cmd = payload.content.coverageMap as CoverageMapData
            this._coverageMaps.push(
                await this.#mapStore.transformCoverage(libCoverage.createCoverageMap(cmd))
            )
        }
    }

    private async _generateCoverageReports () {
        if (!this.#coverageOptions.enabled || this._coverageMaps.length === 0) {
            return true
        }

        const firstCoverageMapEntry = this._coverageMaps.shift() as CoverageMap
        const coverageMap = libCoverage.createCoverageMap(firstCoverageMapEntry)
        this._coverageMaps.forEach((cm) => coverageMap.merge(cm))

        const coverageIssues: string[] = []
        try {
            const context = libReport.createContext({
                dir: this.#reportsDirectory,
                defaultSummarizer: 'nested',
                coverageMap
            })

            const reporter = this.#coverageOptions.reporter
                ? Array.isArray(this.#coverageOptions.reporter) ? this.#coverageOptions.reporter : [this.#coverageOptions.reporter]
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

            const summaryFilePath = path.join(this.#reportsDirectory, 'coverage-summary.json')
            const summary = JSON.parse((await fs.readFile(summaryFilePath)).toString())
            coverageIssues.push(
                ...this.#coverageOptions.perFile
                    ? Object.entries(summary)
                        .filter(([source]) => source !== 'total')
                        .map(([source, summary]: any) => (
                            getCoverageByFactor(this.#coverageOptions, summary, source.replace(this.#config.rootDir, '')))
                        )
                        .flat()
                    : getCoverageByFactor(this.#coverageOptions, summary.total)
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

/**
 * re-export mock types
 */
export * from '@vitest/spy'

/**
 * The following exports are meaningless and only there to allow proper type support.
 * The actual implementation can be found in /src/browser.spy.ts
 */

/**
 * Makes all imports to passed module to be mocked.
 *
 * If there is a factory, will return it's result. The call to `mock` is hoisted to the top of the file,
 * so you don't have access to variables declared in the global file scope, if you didn't put them before imports!
 *
 * If __mocks__ folder with file of the same name exist, all imports will return it.
 *
 * If there is no __mocks__ folder or a file with the same name inside, will call original module and mock it.
 *
 * @param {string} path Path to the module.
 * @param {MockFactoryWithHelper} factory (optional) Factory for the mocked module. Has the highest priority.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mock (path: string, factory?: MockFactoryWithHelper) {}

/**
 * Removes module from mocked registry. All subsequent calls to import will return original module even if it was mocked.
 *
 * @param path Path to the module.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function unmock(moduleName: string) {}

/**
 * Type helpers for TypeScript. In reality just returns the object that was passed.
 * @example
 * import example from './example'
 * vi.mock('./example')
 *
 * test('1+1 equals 2' async () => {
 *  vi.mocked(example.calc).mockRestore()
 *
 *  const res = example.calc(1, '+', 1)
 *
 *  expect(res).toBe(2)
 * })
 *
 * @param item Anything that can be mocked
 * @returns
 */
export function mocked<T>(item: T, deep?: true): MaybeMockedDeep<T>
export function mocked<T>(item: T, deep?: false): MaybeMockedDeep<T>
export function mocked<T>(item: T, options: {
    partial?: false;
    deep?: false;
}): MaybeMocked<T>;
export function mocked<T>(item: T, options: {
    partial?: false;
    deep: true;
}): MaybeMockedDeep<T>;
export function mocked<T>(item: T, options: {
    partial: true;
    deep?: false;
}): MaybePartiallyMocked<T>;
export function mocked<T>(item: T, options: {
    partial: true;
    deep: true;
}): MaybePartiallyMockedDeep<T>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function mocked (item: any, options: any) {}
