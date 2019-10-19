import path from 'path'
import child from 'child_process'
import EventEmitter from 'events'

import logger from '@wdio/logger'

import RunnerTransformStream from './transformStream'
import ReplQueue from './replQueue'
import RunnerStream from './stdStream'

const log = logger('@wdio/local-runner')
const replQueue = new ReplQueue()

const stdOutStream = new RunnerStream()
const stdErrStream = new RunnerStream()
stdOutStream.pipe(process.stdout)
stdErrStream.pipe(process.stderr)

/**
 * WorkerInstance
 * Responsible for spawning a subprocess to run the framework, and handle its
 * session lifetime.
 */
export default class WorkerInstance extends EventEmitter {
    /**
     * Assigns paramters to scope of instance.
     * @param  {object}   config      - Parsed configuration object
     * @param  {string}   cid         - Capability id (e.g. 0-1)
     * @param  {string}   configFile  - Path to config file (for subprocess to parse)
     * @param  {object}   caps        - Capability object
     * @param  {string[]} specs       - List of paths to test files to run in this worker
     * @param  {object}   server      - Configuration details about automation backend this session is using
     * @param  {number}   retries     - Number of retries remaining
     * @param  {object}   execArgv    - Execution arguments for the test run
     */
    constructor (config, { cid, configFile, caps, specs, server, execArgv, retries }, stdout, stderr) {
        super()
        this.cid = cid
        this.config = config
        this.configFile = configFile
        this.caps = caps
        this.specs = specs
        this.server = server || {}
        this.execArgv = execArgv
        this.retries = retries
        this.isBusy = false
        this.stdout = stdout
        this.stderr = stderr
    }

    /**
     * Spawns process to kick off wdio-runner.
     */
    startProcess () {
        const { cid, execArgv } = this
        const argv = process.argv.slice(2)

        const runnerEnv = Object.assign(process.env, this.config.runnerEnv, {
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

        childProcess.on('message', ::this._handleMessage)
        childProcess.on('error', ::this._handleError)
        childProcess.on('exit', ::this._handleExit)

        /* istanbul ignore if */
        if (!process.env.JEST_WORKER_ID) {
            childProcess.stdout.pipe(new RunnerTransformStream(cid)).pipe(stdOutStream)
            childProcess.stderr.pipe(new RunnerTransformStream(cid)).pipe(stdErrStream)
        }

        return childProcess
    }

    _handleMessage (payload) {
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
                Object.assign(this.server, payload.content)
            }
            return
        }

        /**
         * handle debug command called within worker process
         */
        if (payload.origin === 'debugger' && payload.name === 'start') {
            replQueue.add(
                childProcess,
                { prompt: `[${cid}] \u203A `, ...payload.params },
                () => this.emit('message', Object.assign(payload, { cid })),
                (ev) => this.emit('message', ev)
            )
            return replQueue.next()
        }

        /**
         * handle debugger results
         */
        if (replQueue.isRunning && payload.origin === 'debugger' && payload.name === 'result') {
            replQueue.runningRepl.onResult(payload.params)
        }

        this.emit('message', Object.assign(payload, { cid }))
    }

    _handleError (payload) {
        const { cid } = this
        this.emit('error', Object.assign(payload, { cid }))
    }

    _handleExit (exitCode) {
        const { cid, childProcess, specs, retries } = this

        /**
         * delete process of worker
         */
        delete this.childProcess
        this.isBusy = false

        log.debug(`Runner ${cid} finished with exit code ${exitCode}`)
        this.emit('exit', { cid, exitCode, specs, retries })
        childProcess.kill('SIGTERM')
    }

    /**
     * Sends a message to the subprocess to execute functions in wdio-runner.
     * @param  {string} command  - Method to run in wdio-runner
     * @param  {object} argv     - Arguments for functions to call
     * @return null
     */
    postMessage (command, argv) {
        const { cid, configFile, caps, specs, server, retries, isBusy } = this

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

        this.childProcess.send({ cid, command, configFile, argv, caps, specs, server, retries })
        this.isBusy = true
    }
}
