import path from 'path'
import child from 'child_process'
import { EventEmitter } from 'events'
import type { WritableStreamBuffer } from 'stream-buffers'
import type { ChildProcess } from 'child_process'
import type { Capabilities, Options } from '@wdio/types'

import logger from '@wdio/logger'

import RunnerTransformStream from './transformStream'
import ReplQueue from './replQueue'
import RunnerStream from './stdStream'

import type { WorkerMessage, WorkerCommand } from './types'

const log = logger('@wdio/local-runner')
const replQueue = new ReplQueue()

const stdOutStream = new RunnerStream()
const stdErrStream = new RunnerStream()
stdOutStream.pipe(process.stdout)
stdErrStream.pipe(process.stderr)

/**
 * WorkerInstance
 * responsible for spawning a sub process to run the framework in and handle its
 * session lifetime.
 */
export default class WorkerInstance extends EventEmitter implements Capabilities.Worker {
    cid: string
    config: Options.Testrunner
    configFile: string
    caps: Capabilities.RemoteCapability
    capabilities: Capabilities.RemoteCapability
    specs: string[]
    execArgv: string[]
    retries: number
    stdout: WritableStreamBuffer
    stderr: WritableStreamBuffer
    childProcess?: ChildProcess
    sessionId?: string
    server?: Record<string, any>

    instances?: Record<string, { sessionId: string }>
    isMultiremote?: boolean

    isBusy = false

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
        { cid, configFile, caps, specs, execArgv, retries }: Capabilities.WorkerRunPayload,
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
        this.execArgv = execArgv
        this.retries = retries
        this.stdout = stdout
        this.stderr = stderr
    }

    /**
     * spawns process to kick of wdio-runner
     */
    startProcess() {
        const { cid, execArgv } = this
        const argv = process.argv.slice(2)

        const runnerEnv = Object.assign({}, process.env, this.config.runnerEnv, {
            WDIO_WORKER: true
        })

        if (this.config.outputDir) {
            runnerEnv.WDIO_LOG_PATH = path.join(this.config.outputDir, `wdio-${cid}.log`)
        }

        log.info(`Start worker ${cid} with arg: ${argv}`)
        const childProcess = this.childProcess = child.fork(path.join(__dirname, 'run.js'), argv, {
            cwd: process.cwd(),
            env: runnerEnv,
            execArgv,
            stdio: ['inherit', 'pipe', 'pipe', 'ipc']
        })

        childProcess.on('message', this._handleMessage.bind(this))
        childProcess.on('error', this._handleError.bind(this))
        childProcess.on('exit', this._handleExit.bind(this))

        /* istanbul ignore if */
        if (!process.env.JEST_WORKER_ID) {
            childProcess.stdout?.pipe(new RunnerTransformStream(cid)).pipe(stdOutStream)
            childProcess.stderr?.pipe(new RunnerTransformStream(cid)).pipe(stdErrStream)
        }

        return childProcess
    }

    private _handleMessage (payload: WorkerMessage) {
        const { cid, childProcess } = this

        /**
         * resolve pending commands
         */
        if (payload.name === 'finisedCommand') {
            this.isBusy = false
        }

        /**
         * store sessionId and connection data to worker instance
         */
        if (payload.name === 'sessionStarted') {
            if (payload.content.isMultiremote) {
                Object.assign(this, payload.content)
            } else {
                this.sessionId = payload.content.sessionId
                delete payload.content.sessionId
            }
            return
        }

        /**
         * handle debug command called within worker process
         */
        if (childProcess && payload.origin === 'debugger' && payload.name === 'start') {
            replQueue.add(
                childProcess,
                { prompt: `[${cid}] \u203A `, ...payload.params },
                () => this.emit('message', Object.assign(payload, { cid })),
                (ev: any) => this.emit('message', ev)
            )
            return replQueue.next()
        }

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
        const { cid, childProcess, specs, retries } = this

        /**
         * delete process of worker
         */
        delete this.childProcess
        this.isBusy = false

        log.debug(`Runner ${cid} finished with exit code ${exitCode}`)
        this.emit('exit', { cid, exitCode, specs, retries })

        if (childProcess) {
            childProcess.kill('SIGTERM')
        }
    }

    /**
     * sends message to sub process to execute functions in wdio-runner
     * @param  command  method to run in wdio-runner
     * @param  args     arguments for functions to call
     */
    postMessage (command: string, args: Capabilities.WorkerMessageArgs): void {
        const { cid, configFile, caps, specs, retries, isBusy } = this

        if (isBusy && command !== 'endSession') {
            return log.info(`worker with cid ${cid} already busy and can't take new commands`)
        }

        /**
         * start up process if worker hasn't done yet or if child process
         * closes after running its job
         */
        if (!this.childProcess) {
            this.childProcess = this.startProcess()
        }

        const cmd: WorkerCommand = { cid, command, configFile, args, caps, specs, retries }
        this.childProcess.send(cmd)
        this.isBusy = true
    }
}
