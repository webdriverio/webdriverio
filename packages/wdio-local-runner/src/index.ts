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
        // Manager is still used per-worker for Wayland Chrome-flag injection
        // (--ozone-platform=wayland) — separate concern from the daemon, which
        // is what actually provides DISPLAY / WAYLAND_DISPLAY.
        this.displayServerManager = new DisplayServerManager(optionsFromConfig(this.config))
    }

    /**
     * Initialize the local runner. Starts a persistent Xvfb/Weston daemon when
     * the user's config requests one (`displayServer`, `displayServerEnabled`),
     * and publishes the daemon's env onto `process.env` so any subsequently
     * `fork()`ed worker — and any child process spawned from a service's
     * `onPrepare` hook (e.g. `tauri-driver`) — inherits the display.
     *
     * This runs at `wdio-cli/launcher.ts` step `runner.initialize()`, which is
     * sequenced **before** `runServiceHook('onPrepare', ...)` (parallel).
     * That ordering is the whole point of doing daemon startup here rather
     * than in a service: services' `onPrepare` hooks race each other under
     * `Promise.all`, so a launcher-as-service can't reliably win the race
     * against a sibling service that spawns its driver in `onPrepare`.
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
        // Wayland Chrome flag injection is per-capability and must happen for
        // every worker — `initialize()`'s daemon already set the env vars; this
        // step adds `--ozone-platform=wayland` (etc.) to chromeOptions.args.
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
