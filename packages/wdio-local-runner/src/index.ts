import logger from '@wdio/logger'
import { WritableStreamBuffer } from 'stream-buffers'
import { XvfbManager } from '@wdio/xvfb'
import type { Workers } from '@wdio/types'

import WorkerInstance from './worker.js'
import { SHUTDOWN_TIMEOUT, BUFFER_OPTIONS } from './constants.js'

const log = logger('@wdio/local-runner')

export type { WorkerInstance }

export interface RunArgs extends Workers.WorkerRunPayload {
    command: string
    args: Workers.WorkerMessageArgs
}

export default class LocalRunner {
    workerPool: Record<string, WorkerInstance> = {}
    private xvfbInitialized = false
    private xvfbManager: XvfbManager

    stdout = new WritableStreamBuffer(BUFFER_OPTIONS)
    stderr = new WritableStreamBuffer(BUFFER_OPTIONS)

    constructor(
        private _options: never,
        protected config: WebdriverIO.Config
    ) {
        // Initialize XvfbManager
        this.xvfbManager = new XvfbManager({
            autoInstall: this.config.xvfbAutoInstall,
            xvfbMaxRetries: this.config.xvfbMaxRetries,
            xvfbRetryDelay: this.config.xvfbRetryDelay
        })
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
        // Initialize XVFB lazily on first worker creation
        if (!this.xvfbInitialized) {
            await this.initializeXvfb(workerOptions)
            this.xvfbInitialized = true
        }

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
            this.xvfbManager
        )
        this.workerPool[workerOptions.cid] = worker
        await worker.postMessage(command, args)
        return worker
    }

    /**
     * Initialize XVFB with capability-aware detection
     */
    private async initializeXvfb(workerOptions: Workers.WorkerRunPayload) {
        // Skip Xvfb initialization if disabled
        if (this.config.autoXvfb === false) {
            log.info('Skipping automatic Xvfb initialization (disabled by config)')
            return
        }

        // Initialize Xvfb if needed for headless testing
        try {
            const capabilities = workerOptions.caps
            const xvfbInitialized = await this.xvfbManager.init(capabilities)
            if (xvfbInitialized) {
                log.info('Xvfb is ready for use')
            }
        } catch (error) {
            log.warn(
                'Failed to initialize Xvfb, continuing without virtual display:',
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

            await worker.postMessage('endSession', payload)
        }

        const shutdownResult = await new Promise<boolean>((resolve) => {
            const timeout = setTimeout(resolve, SHUTDOWN_TIMEOUT)
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

        // Xvfb cleanup is handled automatically by xvfb-run
        if (this.xvfbManager.shouldRun()) {
            log.info('Xvfb cleanup handled automatically by xvfb-run')
        }

        return shutdownResult
    }
}
