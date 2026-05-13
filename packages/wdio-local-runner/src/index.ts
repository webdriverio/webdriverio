import logger from '@wdio/logger'
import { WritableStreamBuffer } from 'stream-buffers'
import { DisplayServerManager, optionsFromConfig } from '@wdio/display-server'
import type { Workers } from '@wdio/types'

import WorkerInstance from './worker.js'
import { SHUTDOWN_TIMEOUT, BUFFER_OPTIONS } from './constants.js'

const log = logger('@wdio/local-runner')

export type { WorkerInstance }

export interface RunArgs extends Workers.WorkerRunPayload {
    command: string
    args: Workers.WorkerMessageArgs
    cid: string
}

export default class LocalRunner {
    workerPool: Record<string, WorkerInstance> = {}
    private displayServerInitPromise: Promise<void> | null = null
    private displayServerManager: DisplayServerManager

    stdout = new WritableStreamBuffer(BUFFER_OPTIONS)
    stderr = new WritableStreamBuffer(BUFFER_OPTIONS)

    constructor(
        private _options: never,
        protected config: WebdriverIO.Config
    ) {
        // Map config → display-server options. The mapping (and its legacy
        // xvfb* / autoXvfb aliases) lives in @wdio/display-server so this
        // file doesn't need to know about either vocabulary.
        this.displayServerManager = new DisplayServerManager(optionsFromConfig(this.config))
    }

    /**
     * initialize local runner environment
     */
    async initialize() {
        // XVFB initialization is handled lazily during first worker creation, to access capabilities for headless detection
    }

    getWorkerCount() {
        return Object.keys(this.workerPool).length
    }

    async run({ command, args, ...workerOptions }: RunArgs) {
        // All concurrent run() calls share one init promise so none advance until init settles
        this.displayServerInitPromise ??= this.initializeDisplayServer(workerOptions)
        await this.displayServerInitPromise
        // Inject Wayland Chrome flags per-worker — init() only runs for the first worker's caps
        this.displayServerManager.injectDisplayFlags(workerOptions.caps)

        /**
         * adjust max listeners on stdout/stderr when creating listeners
         */
        const workerCnt = this.getWorkerCount()
        if (workerCnt >= process.stdout.getMaxListeners() - 2) {
            process.stdout.setMaxListeners(workerCnt + 2)
            process.stderr.setMaxListeners(workerCnt + 2)
        }

        const worker = new WorkerInstance(
            this.config,
            workerOptions,
            this.stdout,
            this.stderr,
            this.displayServerManager
        )
        this.workerPool[workerOptions.cid] = worker
        await worker.postMessage(command, args)
        return worker
    }

    /**
     * Initialize display server with capability-aware detection
     */
    private async initializeDisplayServer(workerOptions: Workers.WorkerRunPayload) {
        // Initialize display server if needed for headless testing
        try {
            const capabilities = workerOptions.caps
            const displayServerReady = await this.displayServerManager.init(capabilities)
            if (displayServerReady) {
                const server = this.displayServerManager.getDisplayServer()
                log.info(`${server?.name || 'Display server'} is ready for use`)
            }
        } catch (error) {
            log.warn(
                'Failed to initialize display server, continuing without virtual display:',
                error
            )
        }
    }

    /**
     * shutdown all worker processes
     *
     * @return {Promise}  resolves when all worker have been shutdown or
     *                    a timeout was reached
     */
    async shutdown() {
        log.info('Shutting down spawned worker')

        // Track workers that need potential forced termination
        const workersToShutdown: [string, WorkerInstance][] = []

        for (const [cid, worker] of Object.entries(this.workerPool)) {
            const {
                capabilities,
                server,
                sessionId,
                config,
                isMultiremote,
                instances,
            } = worker
            let payload: Partial<Workers.WorkerMessageArgs> = {}

            /**
             * put connection information to payload if in watch mode
             * in order to attach to browser session and kill it
             */
            if (config && config.watch && (sessionId || isMultiremote)) {
                payload = {
                    config: { ...server, sessionId, ...config },
                    capabilities,
                    watch: true,
                    isMultiremote,
                    instances,
                } as unknown as Workers.WorkerMessageArgs
            } else if (!worker.isBusy) {
                delete this.workerPool[cid]
                continue
            }

            // Track this worker for potential forced shutdown
            if (worker.isBusy) {
                workersToShutdown.push([cid, worker])
            }

            await worker.postMessage('endSession', payload)
        }

        const shutdownResult = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(() => {
                /**
                 * Force kill any workers that are still busy after timeout.
                 * This prevents async operations (like polling loops) from
                 * polluting subsequent test runs.
                 * @see https://github.com/webdriverio/webdriverio/discussions/14686
                 */
                for (const [cid, worker] of workersToShutdown) {
                    if (worker.isBusy && !worker.isKilled) {
                        log.warn(`Worker ${cid} did not shut down gracefully, force killing with SIGKILL`)
                        worker.kill('SIGKILL')
                    }
                }
                resolve(false)
            }, SHUTDOWN_TIMEOUT)
            const interval = setInterval(() => {
                const busyWorker = Object.entries(this.workerPool).filter(
                    ([, worker]) => worker.isBusy
                ).length

                log.info(`Waiting for ${busyWorker} to shut down gracefully`)
                if (busyWorker === 0) {
                    clearTimeout(timeout)
                    clearInterval(interval)
                    log.info('shutting down')
                    return resolve(true)
                }
            }, 250)
        })

        if (this.displayServerManager.shouldRun()) {
            const server = this.displayServerManager.getDisplayServer()
            log.info(`${server?.name || 'Display server'} cleanup handled automatically`)
        }

        return shutdownResult
    }
}
