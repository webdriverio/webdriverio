import path from 'path'
import EventEmitter from 'events'

import logger from '@wdio/logger'
import Runner from '@wdio/runner'

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
 * responsible for spawning a sub process to run the framework in and handle its
 * session lifetime.
 */
export default class WorkerInstance extends EventEmitter {
    /**
     * assigns paramters to scope of instance
     * @param  {object}   config      parsed configuration object
     * @param  {string}   cid         capability id (e.g. 0-1)
     * @param  {string}   configFile  path to config file (for sub process to parse)
     * @param  {object}   caps        capability object
     * @param  {string[]} specs       list of paths to test files to run in this worker
     * @param  {object}   server      configuration details about automation backend this session is using
     * @param  {number}   retries     number of retries remaining
     * @param  {object}   execArgv    execution arguments for the test run
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
     * spawns process to kick of wdio-runner
     */
    startProcess () {
        const { cid } = this
        const argv = process.argv.slice(2)

        const runnerEnv = Object.assign({}, process.env, this.config.runnerEnv, {
            WDIO_WORKER: true
        })

        if (this.config.outputDir) {
            runnerEnv.WDIO_LOG_PATH = path.join(this.config.outputDir, `wdio-${cid}.log`)
        }

        // This class emulates a child process. This is not here to stay;
        // I did this in order to test my assumption that I can get rid of the multiple transpilations
        // by using the same process. Unfortunately the whole of webdriverio is architected in a way that
        // it uses inter-process communication via `process.send`. As I wanted to get a changeset for
        // discussion up first, I decided to minimize the changes and just inject the fake child process
        // into components that assume to be executed in a child process.
        class FakeChildProcess {
            constructor(worker) {
                this.runner = new Runner(this)
                this.worker = worker
                this.runner.on('error', ({ name, message, stack }) => this.worker._handleError({
                    origin: 'worker',
                    name: 'error',
                    content: { name, message, stack }
                }))
                this.runner.on('exit', ::this.worker._handleExit)
            }
            send(m) {
                if (!m || !m.command) {
                    this.worker._handleMessage(m)
                    return
                }

                log.info(`Run worker command: ${m.command}`)
                this.runner[m.command](m).then(
                    (result) => this.worker._handleMessage({
                        origin: 'worker',
                        name: 'finisedCommand',
                        content: {
                            command: m.command,
                            result
                        }
                    }),
                    (e) => {
                        log.error(`Failed launching test session: ${e.stack}`)
                        process.exit(1)
                    }
                )
            }
        }

        log.info(`Start worker ${cid} with arg: ${argv}`)
        const childProcess = this.childProcess = new FakeChildProcess(this)

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
        const { cid, specs, retries } = this
        this.isBusy = false

        log.debug(`Runner ${cid} finished with exit code ${exitCode}`)
        this.emit('exit', { cid, exitCode, specs, retries })
    }

    /**
     * sends message to sub process to execute functions in wdio-runner
     * @param  {string} command  method to run in wdio-runner
     * @param  {object} argv     arguments for functions to call
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
