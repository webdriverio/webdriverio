import logger from '@wdio/logger'
import { WritableStreamBuffer } from 'stream-buffers'
import {
    DisplayServerManager,
    optionsFromConfig,
    startDisplayDaemonFromConfig,
    type RunningDaemon,
} from '@wdio/display-server'
import type { Capabilities, Workers } from '@wdio/types'

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
    private displayServerManager: DisplayServerManager
    private daemon: RunningDaemon | null = null

    stdout = new WritableStreamBuffer(BUFFER_OPTIONS)
    stderr = new WritableStreamBuffer(BUFFER_OPTIONS)

    constructor(
        private _options: never,
        protected config: WebdriverIO.Config
    ) {
        // Manager handles per-worker Chrome / Edge / Electron flag injection;
        // the daemon (started in initialize()) handles the env vars themselves.
        this.displayServerManager = new DisplayServerManager(optionsFromConfig(this.config))
    }

    /**
     * Start a persistent Xvfb/Weston daemon (if the config requests one) and
     * publish its env onto `process.env` so workers — and any child process
     * spawned from a service's `onPrepare` (e.g. `tauri-driver`) — inherit
     * the display. Runs before any service `onPrepare`.
     */
    async initialize() {
        const capabilities = this.config.capabilities as Capabilities.TestrunnerCapabilities | undefined
        this.daemon = await startDisplayDaemonFromConfig(
            this.config,
            capabilities ?? ([] as unknown as Capabilities.TestrunnerCapabilities),
            this.displayServerManager,
        )
        if (this.daemon) {
            log.info('Display server daemon initialized for this run')
        }
    }

    getWorkerCount() {
        return Object.keys(this.workerPool).length
    }

    async run({ command, args, ...workerOptions }: RunArgs) {
        // Per-worker `--ozone-platform=...` injection (env vars were set in
        // initialize()).
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
        )
        this.workerPool[workerOptions.cid] = worker
        await worker.postMessage(command, args)
        return worker
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

        if (this.daemon) {
            try {
                await this.daemon.stop()
            } finally {
                this.daemon = null
            }
        }

        return shutdownResult
    }
}
