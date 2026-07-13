import url from 'node:url'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import type { ChildProcess } from 'node:child_process'
import type { WritableStreamBuffer } from 'stream-buffers'
import { ProcessFactory, type XvfbManager } from '@wdio/xvfb'
import type { Workers, AnyIPCMessage, WSMessageValue, WS_MESSAGE_TYPES } from '@wdio/types'
import { IPC_MESSAGE_TYPES } from '@wdio/types'
import type { ReplConfig } from '@wdio/repl'
import { createServerRpc, createWorkerRpcTransport, isBirpcFrame, WORKER_RPC_EVENT } from '@wdio/rpc'
import type { ClientFunctions, ServerFunctions, RpcTransportChannel, WorkerRequest, BirpcReturn } from '@wdio/rpc'

/**
 * subset of parent-side RPC server handlers that the browser-runner cares about.
 * These are registered on the single `WorkerInstance` RPC server via
 * `registerBrowserRunnerRpcHandlers` rather than by creating a second RPC server.
 */
export type BrowserRunnerHandlers = {
    sessionMetadata?: ServerFunctions['sessionMetadata']
    sessionEnded?: ServerFunctions['sessionEnded']
    workerEvent?: ServerFunctions['workerEvent']
    workerResponse?: ServerFunctions['workerResponse']
    errorMessage?: ServerFunctions['errorMessage']
}

import logger from '@wdio/logger'

import runnerTransformStream from './transformStream.js'
import ReplQueue from './replQueue.js'
import RunnerStream from './stdStream.js'

const log = logger('@wdio/local-runner')
const replQueue = new ReplQueue()
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const ACCEPTABLE_BUSY_COMMANDS = ['workerRequest', 'endSession']

/**
 * type guard that verifies a payload is a typed IPC envelope, e.g.
 * `{ type: IPC_MESSAGE_TYPES.reporterRealTime, value: { ... } }`.
 *
 * It explicitly requires a known `IPC_MESSAGE_TYPES` value so that birpc wire
 * frames (which are handled separately by `createServerRpc`) are not mistaken
 * for IPC envelopes and forwarded to the CLI as malformed messages.
 */
function isTypedIPCMessage(payload: unknown): payload is AnyIPCMessage {
    return Boolean(
        payload &&
        typeof payload === 'object' &&
        'type' in payload &&
        'value' in payload &&
        Object.values(IPC_MESSAGE_TYPES).includes((payload as AnyIPCMessage).type)
    )
}

const stdOutStream = new RunnerStream()
const stdErrStream = new RunnerStream()
stdOutStream.pipe(process.stdout)
stdErrStream.pipe(process.stderr)

/**
 * WorkerInstance
 * responsible for spawning a sub process to run the framework in and handle its
 * session lifetime.
 */
export default class WorkerInstance extends EventEmitter implements Workers.Worker {
    cid: string
    config: WebdriverIO.Config
    configFile: string
    // requestedCapabilities
    caps: WebdriverIO.Capabilities
    // actual capabilities returned by driver
    capabilities: WebdriverIO.Capabilities
    specs: string[]
    execArgv: string[]
    retries: number
    stdout: WritableStreamBuffer
    stderr: WritableStreamBuffer
    childProcess?: ChildProcess
    sessionId?: string
    server?: Record<string, string>
    logsAggregator: string[] = []
    #processFactory: ProcessFactory
    #rpcTransport: RpcTransportChannel
    /**
     * single parent-side RPC server proxy for this worker. Used to call
     * worker-side `ClientFunctions` (e.g. forward browser events).
     */
    #rpc: BirpcReturn<ClientFunctions, ServerFunctions>
    /**
     * optional browser-runner handlers, registered via
     * `registerBrowserRunnerRpcHandlers`. There is at most one set at a time.
     */
    #browserRunnerHandlers?: BrowserRunnerHandlers

    instances?: Record<string, { sessionId: string }>
    isMultiremote?: boolean

    isBusy = false
    isKilled = false
    isReady: Promise<boolean>
    isSetup: Promise<boolean>
    isReadyResolver: (value: boolean | PromiseLike<boolean>) => void = () => {}
    isSetupResolver: (value: boolean | PromiseLike<boolean>) => void = () => {}

    /**
     * assigns paramters to scope of instance
     * @param  {object}   config      parsed configuration object
     * @param  {string}   cid         capability id (e.g. 0-1)
     * @param  {string}   configFile  path to config file (for sub process to parse)
     * @param  {object}   caps        capability object
     * @param  {string[]} specs       list of paths to test files to run in this worker
     * @param  {number}   retries     number of retries remaining
     * @param  {object}   execArgv    execution arguments for the test run
     * @param  {XvfbManager} xvfbManager configured XvfbManager instance
     */
    constructor(
        config: WebdriverIO.Config,
        { cid, configFile, caps, specs, execArgv, retries }: Workers.WorkerRunPayload,
        stdout: WritableStreamBuffer,
        stderr: WritableStreamBuffer,
        xvfbManager: XvfbManager
    ) {
        super()
        this.cid = cid
        this.config = config
        this.configFile = configFile
        this.caps = caps
        this.capabilities = caps
        this.specs = specs
        this.execArgv = execArgv
        this.retries = retries
        this.stdout = stdout
        this.stderr = stderr
        this.#processFactory = new ProcessFactory(xvfbManager)

        this.isReady = new Promise((resolve) => { this.isReadyResolver = resolve })
        this.isSetup = new Promise((resolve) => { this.isSetupResolver = resolve })

        /**
         * the worker transport hides the `childProcess.send` / worker event
         * wiring and lets us dispose the RPC listener on worker exit/kill.
         * birpc wire frames are routed to this transport by `_handleMessage`
         * via the dedicated `WORKER_RPC_EVENT`, keeping them off the generic
         * `message` event that the CLI consumes.
         */
        this.#rpcTransport = createWorkerRpcTransport(this)
        this.#rpc = createServerRpc<ClientFunctions, ServerFunctions>(
            this.#rpcTransport,
            {
                sessionMetadata: (data) => {
                    /**
                     * both the local runner and the browser runner care about
                     * session metadata, so call both intentionally
                     */
                    this.#browserRunnerHandlers?.sessionMetadata?.(data)

                    if (this.sessionId || this.instances || this.isMultiremote) {
                        return
                    }
                    this.isSetupResolver(true)
                    if (this.retries === -1 && data.specFileRetries) {
                        this.retries = data.specFileRetries - 1
                    }
                    if (data.isMultiremote) {
                        Object.assign(this, data)
                    } else {
                        this.sessionId = data.sessionId
                        this.capabilities = data.capabilities as WebdriverIO.Capabilities
                        Object.assign(this.config, data)
                    }
                },
                sessionStarted: () => {},
                sessionEnded: (data) => this.#browserRunnerHandlers?.sessionEnded?.(data),
                /**
                 * bridge typed birpc messages back to the legacy flat events
                 * that `WDIOCLInterface.onMessage` still expects
                 */
                snapshotResults: (data) => {
                    this.emit('message', { ...data, cid: this.cid })
                },
                printFailureMessage: () => {},
                errorMessage: (data) => {
                    this.emit('message', { ...data, cid: this.cid })
                    this.#browserRunnerHandlers?.errorMessage?.(data)
                },
                testFrameworkInitMessage: (data) => {
                    this.emit('message', { name: 'testFrameworkInit', content: data, cid: this.cid })
                },
                /**
                 * browser-runner-specific events are delegated to the registered
                 * browser-runner handlers (if any). When none are registered
                 * (local runner) they are safely ignored.
                 */
                workerEvent: (data) => this.#browserRunnerHandlers?.workerEvent?.(data),
                workerResponse: (data) => this.#browserRunnerHandlers?.workerResponse?.(data),
            },
            {
                /**
                 * forward browser requests as fire-and-forget events. The worker
                 * replies asynchronously via the `workerResponse` server function,
                 * and the child process hosts more than one RPC client, so we must
                 * not await a single response here.
                 */
                eventNames: ['workerRequest', 'consoleMessage', 'browserTestResult']
            }
        )
    }

    /**
     * Register browser-runner specific RPC handlers on this worker's single
     * parent-side RPC server. This avoids creating a second `createServerRpc`
     * (and a second transport listener) for the same worker.
     * @returns a disposer that unregisters the handlers
     */
    registerBrowserRunnerRpcHandlers (handlers: BrowserRunnerHandlers): () => void {
        this.#browserRunnerHandlers = handlers
        return () => {
            if (this.#browserRunnerHandlers === handlers) {
                this.#browserRunnerHandlers = undefined
            }
        }
    }

    /**
     * forward a browser WebSocket request to the worker process via the existing
     * RPC proxy. The worker replies through the `workerResponse` server function.
     */
    sendWorkerRequest (data: WorkerRequest): void {
        this.#rpc.workerRequest(data)
    }

    /**
     * forward a fire-and-forget browser console message to the worker process
     */
    sendConsoleMessage (data: WSMessageValue[typeof WS_MESSAGE_TYPES.consoleMessage]): void {
        this.#rpc.consoleMessage(data)
    }

    /**
     * forward a fire-and-forget browser test result to the worker process
     */
    sendBrowserTestResult (data: WSMessageValue[typeof WS_MESSAGE_TYPES.browserTestResult]): void {
        this.#rpc.browserTestResult(data)
    }

    /**
     * spawns process to kick of wdio-runner
     */
    async startProcess() {
        const { cid, execArgv } = this
        const argv = process.argv.slice(2)

        const runnerEnv = Object.assign({
            NODE_OPTIONS: '--enable-source-maps',
        }, process.env, this.config.runnerEnv, {
            WDIO_WORKER_ID: cid,
            NODE_ENV: process.env.NODE_ENV || 'test'
        })

        if (this.config.outputDir) {
            let logFileRunner = `wdio-${cid}.log`
            if (this.specs.length && this.specs[0]) {
                const specBaseName = path.basename(this.specs[0], path.extname(this.specs[0]))
                logFileRunner = `${specBaseName}-${cid}.log`
            }
            runnerEnv.WDIO_LOG_PATH = path.join(this.config.outputDir, logFileRunner)
        }

        /**
         * propagate node flags to child process, e.g. `--import tsx`
         */
        runnerEnv.NODE_OPTIONS = process.env.NODE_OPTIONS + ' ' + (runnerEnv.NODE_OPTIONS || '')

        log.info(`Start worker ${cid} with arg: ${argv.join(' ')}`)

        // Use ProcessFactory to create the appropriate process
        const childProcess = this.childProcess = await this.#processFactory.createWorkerProcess(
            path.join(__dirname, 'run.js'),
            argv,
            {
                cwd: process.cwd(),
                env: runnerEnv,
                execArgv,
                stdio: ['inherit', 'pipe', 'pipe', 'ipc']
            }
        )

        childProcess.on('message', this._handleMessage.bind(this))
        childProcess.on('error', this._handleError.bind(this))
        childProcess.on('exit', this._handleExit.bind(this))

        /* istanbul ignore if */
        if (!process.env.WDIO_UNIT_TESTS) {
            if (childProcess.stdout !== null) {
                if (this.config.groupLogsByTestSpec) {
                    // Test spec logs are collected only from child stdout stream
                    // and then printed when the worker exits
                    // As a result, there is no pipe to parent stdout stream here
                    runnerTransformStream(cid, childProcess.stdout, this.logsAggregator)
                } else {
                    runnerTransformStream(cid, childProcess.stdout).pipe(stdOutStream)
                }
            }

            if (childProcess.stderr !== null) {
                runnerTransformStream(cid, childProcess.stderr).pipe(stdErrStream)
            }
        }

        return childProcess
    }

    private _handleMessage (payload: Workers.WorkerMessage) {
        const { cid, childProcess } = this

        /**
         * birpc wire frames are internal to the RPC layer. Forward them to the
         * RPC transport via a dedicated event so the typed server handlers run,
         * but never emit them on the generic `message` event consumed by the CLI.
         */
        if (isBirpcFrame(payload)) {
            this.emit(WORKER_RPC_EVENT, payload)
            return
        }

        /**
         * resolve pending commands
         */
        if (payload.name === 'finishedCommand') {
            this.isBusy = false
        }

        /**
         * mark worker process as ready to receive events
         */
        if (payload.name === 'ready') {
            this.isReadyResolver(true)
        }

        /**
         * store sessionId and connection data to worker instance
         * Note: birpc sessionMetadata is handled via createServerRpc in the constructor
         */
        if (payload.name === 'sessionStarted') {
            if (this.sessionId || this.instances || this.isMultiremote) {
                return
            }
            this.isSetupResolver(true)
            if (this.retries === -1 && payload.specFileRetries) {
                this.retries = payload.specFileRetries - 1
            }
            if (payload.content.isMultiremote) {
                Object.assign(this, payload.content)
            } else {
                this.sessionId = payload.content.sessionId
                this.capabilities = payload.content.capabilities
                Object.assign(this.config, payload.content)
            }
        }

        /**
         * handle debug command called within worker process
         */
        if (childProcess && payload.origin === 'debugger' && payload.name === 'start') {
            replQueue.add(
                childProcess,
                { prompt: `[${cid}] \u203A `, ...payload.params } as ReplConfig,
                () => this.emit('message', Object.assign(payload, { cid })),
                (ev: unknown) => this.emit('message', ev)
            )
            return replQueue.next()
        }

        /**
         * handle debugger results
         */
        if (replQueue.isRunning && payload.origin === 'debugger' && payload.name === 'result') {
            replQueue.runningRepl?.onResult(payload.params)
        }

        /**
         * normalize typed IPC envelopes into the legacy flat shape the CLI
         * (`WDIOCLInterface.onMessage`) expects. We unwrap the envelope `value`
         * and attach `cid` without mutating the original payload object.
         */
        if (isTypedIPCMessage(payload)) {
            if (
                payload.type === IPC_MESSAGE_TYPES.reporterRealTime ||
                payload.type === IPC_MESSAGE_TYPES.errorMessage
            ) {
                return this.emit('message', { ...payload.value, cid })
            }
        }

        this.emit('message', Object.assign(payload, { cid }))
    }

    private _handleError (payload: Error) {
        const { cid } = this
        this.emit('error', Object.assign(payload, { cid }))
    }

    private _handleExit (exitCode: number) {
        const { cid, childProcess, specs, retries } = this

        /**
         * delete process of worker
         */
        delete this.childProcess
        this.isBusy = false
        this.isKilled = true

        /**
         * clean up the per-worker RPC listener now that the process is gone
         */
        this.#rpcTransport.dispose?.()

        log.debug(`Runner ${cid} finished with exit code ${exitCode}`)
        this.emit('exit', { cid, exitCode, specs, retries })

        if (childProcess) {
            childProcess.kill('SIGTERM')
        }
    }

    /**
     * Forcefully kill the worker process.
     * This is used when a worker doesn't respond to graceful shutdown
     * (e.g., when a test times out with pending async operations).
     *
     * @param signal - The signal to send (default: 'SIGTERM', use 'SIGKILL' for force kill)
     */
    kill(signal: NodeJS.Signals = 'SIGTERM'): void {
        if (!this.childProcess) {
            log.debug(`Worker ${this.cid} has no child process to kill`)
            return
        }

        log.info(`Killing worker ${this.cid} with ${signal}`)
        try {
            this.childProcess.kill(signal)
        } catch (err) {
            log.warn(`Failed to kill worker ${this.cid}:`, err)
        }
        delete this.childProcess
        this.isBusy = false
        this.isKilled = true
        this.#rpcTransport.dispose?.()
    }

    /**
     * sends message to sub process to execute functions in wdio-runner
     * @param  command  method to run in wdio-runner
     * @param  args     arguments for functions to call
     */
    async postMessage (command: string, args: Workers.WorkerMessageArgs, requiresSetup = false): Promise<void> {
        const { cid, configFile, capabilities, specs, retries, isBusy } = this

        if (isBusy && !ACCEPTABLE_BUSY_COMMANDS.includes(command)) {
            return log.info(`worker with cid ${cid} already busy and can't take new commands`)
        }

        /**
         * start up process if worker hasn't done yet or if child process
         * closes after running its job
         */
        if (!this.childProcess) {
            this.childProcess = await this.startProcess()
        }

        const cmd: Workers.WorkerCommand = { cid, command, configFile, args, caps: capabilities, specs, retries }
        log.debug(`Send command ${command} to worker with cid "${cid}"`)
        this.isReady.then(async () => {
            if (requiresSetup) {
                await this.isSetup
            }

            if (this.childProcess) {
                this.childProcess.send(cmd)
            }
        }).catch((err) => log.error(`Failed to send command to worker ${this.cid}: ${err.message}`))
        this.isBusy = true
    }
}
