import path from 'node:path'
import { EventEmitter } from 'node:events'
import type { WritableStreamBuffer } from 'stream-buffers'
import type { Options, Workers } from '@wdio/types'

import logger from '@wdio/logger'

import runnerTransformStream from './transformStream.js'
import ReplQueue from './replQueue.js'
import RunnerStream from './stdStream.js'
import type { IsolatedProcess } from './runLite.js'
import { run } from './runLite.js'

const log = logger('@wdio/lite-runner')
const replQueue = new ReplQueue()
const ACCEPTABLE_BUSY_COMMANDS = ['workerRequest', 'endSession']

const stdOutStream = new RunnerStream()
const stdErrStream = new RunnerStream()
stdOutStream.pipe(process.stdout)
stdErrStream.pipe(process.stderr)

/**
 * WorkerInstance
 * responsible for spawning a sub process to run the framework in and handle its
 * session lifetime.
 */
export default class LiteWorkerInstance extends EventEmitter implements Workers.Worker {
    cid: string
    config: Options.Testrunner
    configFile: string
    // requestedCapabilities
    caps: WebdriverIO.Capabilities
    // actual capabilities returned by driver
    capabilities: WebdriverIO.Capabilities
    specs: string[]
    retries: number
    stdout: WritableStreamBuffer
    stderr: WritableStreamBuffer
    child?: IsolatedProcess
    sessionId?: string
    server?: Record<string, any>
    logsAggregator: string[] = []

    instances?: Record<string, { sessionId: string }>
    isMultiremote?: boolean

    isBusy = false
    isKilled = false
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
     */
    constructor(
        config: Options.Testrunner,
        { cid, configFile, caps, specs, retries }: Workers.WorkerRunPayload,
        stdout: WritableStreamBuffer,
        stderr: WritableStreamBuffer
    ) {
        super()
        this.cid = cid
        this.config = config
        this.configFile = configFile
        this.caps = caps
        this.capabilities = caps
        this.specs = specs
        this.retries = retries
        this.stdout = stdout
        this.stderr = stderr

        this.isSetup = new Promise((resolve) => { this.isSetupResolver = resolve })
    }

    /**
     * calls wdio-runner
     */
    private startProcess() {
        const { cid } = this

        const runnerEnv = Object.assign({}, process.env, this.config.runnerEnv, {
            WDIO_WORKER_ID: cid,
            NODE_ENV: process.env.NODE_ENV || 'test'
        })

        if (this.config.outputDir) {
            runnerEnv.WDIO_LOG_PATH = path.join(this.config.outputDir, `wdio-${cid}.log`)
        }

        log.info(`Start lite worker ${cid}`)

        const child = run(runnerEnv)

        child.emitter.on('send', this._handleMessage.bind(this))
        child.emitter.on('error', this._handleError.bind(this))
        child.emitter.on('exit', this._handleExit.bind(this))

        /* istanbul ignore if */
        if (!process.env.VITEST_WORKER_ID) {
            if (child.stdout !== null) {
                if (this.config.groupLogsByTestSpec) {
                    // Test spec logs are collected only from child stdout stream
                    // and then printed when the worker exits
                    // As a result, there is no pipe to parent stdout stream here
                    runnerTransformStream(cid, child.stdout, this.logsAggregator)
                } else {
                    runnerTransformStream(cid, child.stdout).pipe(stdOutStream)
                }
            }

            if (child.stderr !== null) {
                runnerTransformStream(cid, child.stderr).pipe(stdErrStream)
            }
        }

        return child
    }

    private _handleMessage (payload: Workers.WorkerMessage) {
        const { cid } = this

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
         */
        if (payload.name === 'sessionStarted') {
            this.isSetupResolver(true)
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
        /**TODO: [alfonso-presa] Handle debug
         *
        if (child && payload.origin === 'debugger' && payload.name === 'start') {
            replQueue.add(
                child,
                { prompt: `[${cid}] \u203A `, ...payload.params },
                () => this.emit('message', Object.assign(payload, { cid })),
                (ev: any) => this.emit('message', ev)
            )
            return replQueue.next()
        }

         */

        /**
         * handle debugger results
         */
        if (replQueue.isRunning && payload.origin === 'debugger' && payload.name === 'result') {
            replQueue.runningRepl?.onResult(payload.params)
        }

        this.emit('message', Object.assign(payload, { cid }))
    }

    private _handleError (payload: Error) {
        const { cid } = this
        this.emit('error', Object.assign(payload, { cid }))
    }

    private _handleExit (exitCode: number) {
        const { cid, specs, retries } = this

        delete this.child
        this.isBusy = false
        this.isKilled = true

        log.debug(`Runner ${cid} finished with exit code ${exitCode}`)
        this.emit('exit', { cid, exitCode, specs, retries })
    }

    /**
     * sends message to sub process to execute functions in wdio-runner
     * @param  command  method to run in wdio-runner
     * @param  args     arguments for functions to call
     */
    postMessage (command: string, args: Workers.WorkerMessageArgs, requiresSetup = false): void {
        const { cid, configFile, capabilities, specs, retries, isBusy } = this

        if (isBusy && !ACCEPTABLE_BUSY_COMMANDS.includes(command)) {
            return log.info(`worker with cid ${cid} already busy and can't take new commands`)
        }

        /**
         * start up process if worker hasn't done yet or if child process
         * closes after running its job
         */
        if (!this.child) {
            this.child = this.startProcess()
        }

        const cmd: Workers.WorkerCommand = { cid, command, configFile, args, caps: capabilities, specs, retries }

        log.debug(`Send command ${command} to worker with cid "${cid}"`)

        setImmediate(async () => {
            if (requiresSetup) {
                this.isSetup
            }
            this.child!.emitter.emit('message', cmd)
        })

        this.isBusy = true
    }
}
