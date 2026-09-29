import url from 'node:url'
import path from 'node:path'
import { fork, type ChildProcess } from 'node:child_process'
import { constants } from 'node:os'
import { EventEmitter } from 'node:events'
import type { WritableStreamBuffer } from 'stream-buffers'
import type { Workers } from '@wdio/types'
import type { ReplConfig } from '@wdio/repl'

import logger from '@wdio/logger'

import runnerTransformStream from './transformStream.js'
import ReplQueue from './replQueue.js'
import RunnerStream from './stdStream.js'

const log = logger('@wdio/local-runner')
const replQueue = new ReplQueue()
const __dirname = path.dirname(url.fileURLToPath(import.meta.url))
const ACCEPTABLE_BUSY_COMMANDS = ['workerRequest', 'endSession']

const stdOutStream = new RunnerStream()
const stdErrStream = new RunnerStream()
stdOutStream.pipe(process.stdout)
stdErrStream.pipe(process.stderr)

/**
 * signals that are expected while the test run is shutting down and therefore
 * shouldn't be reported as a crash
 */
const GRACEFUL_SHUTDOWN_SIGNALS: NodeJS.Signals[] = ['SIGTERM', 'SIGINT']
const SIGNAL_EXIT_CODE_OFFSET = 128
const UNKNOWN_SIGNAL_EXIT_CODE = 1

/**
 * a process terminated by a signal carries no exit code, so fall back to the
 * shell convention of `128 + signal number` (e.g. 139 for `SIGSEGV`). Returning
 * a real number matters beyond the log line: the launcher accumulates worker
 * results with `this._exitCode || exitCode`, so a falsy `null` is dropped and a
 * crashed worker can end up reporting a passing run.
 */
function getExitCodeForSignal (signal: NodeJS.Signals | null) {
    const signalNumber = signal ? constants.signals[signal] : undefined
    return signalNumber ? SIGNAL_EXIT_CODE_OFFSET + signalNumber : UNKNOWN_SIGNAL_EXIT_CODE
}

/**
 * Flags whose next token is the operand (`--import tsx`, `--require "./my modules/a.js"`,
 * `--max-old-space-size 2048`). `--max-old-space-size=4096` stays one token.
 */
const NODE_OPTIONS_WITH_VALUE = new Set([
    '-r',
    '--require',
    '--import',
    '--experimental-loader',
    '--loader',
    '--conditions',
    '-C',
    '--max-old-space-size',
    '--max-semi-space-size',
])

/**
 * These may appear more than once. A runner value adds to the parent list.
 * `--max-old-space-size` is not here: the runner value replaces the parent one,
 * including a value that was a separate token.
 */
const REPEATABLE_NODE_OPTIONS = new Set([
    '-r',
    '--require',
    '--import',
    '--experimental-loader',
    '--loader',
    '--conditions',
    '-C',
])

function nodeOptionName (group: string) {
    return group.split(' ')[0].split('=')[0]
}

/**
 * Split on whitespace, but keep a quoted operand intact. `--require "./my modules/a.js"`
 * is two tokens, and the path stays quoted so joining the result does not break it.
 */
function tokenizeNodeOptions (value: string) {
    const tokens: string[] = []
    let current = ''
    let quote: '"' | "'" | undefined
    const push = () => {
        if (current) {
            tokens.push(current)
            current = ''
        }
    }
    for (const char of value) {
        if (quote) {
            current += char
            if (char === quote) {
                quote = undefined
            }
            continue
        }
        if (char === '"' || char === "'") {
            quote = char
            current += char
            continue
        }
        if (/\s/.test(char)) {
            push()
            continue
        }
        current += char
    }
    push()
    return tokens
}

function parseNodeOptionGroups (value: string) {
    const parts = tokenizeNodeOptions(value)
    const groups: string[] = []
    for (let i = 0; i < parts.length; i++) {
        const token = parts[i]
        const name = token.split('=')[0]
        const next = parts[i + 1]
        if (!token.includes('=') && NODE_OPTIONS_WITH_VALUE.has(name) && next && !next.startsWith('-')) {
            groups.push(`${token} ${next}`)
            i++
            continue
        }
        groups.push(token)
    }
    return groups
}

/**
 * Keep parent flags (including the launcher's `--import tsx`) and append
 * `config.runnerEnv.NODE_OPTIONS`. Repeatable flags (`--import`, `--require`,
 * `--conditions`) are unioned, so a runner value that merely contains the parent
 * text cannot drop them. A runner flag replaces the parent value when both set
 * the same non-repeatable option, including a value that follows the flag.
 */
function mergeWorkerNodeOptions (parent: string, runner: string | undefined) {
    const merged = parseNodeOptionGroups(parent)
    if (typeof runner !== 'string') {
        return merged.join(' ')
    }

    for (const group of parseNodeOptionGroups(runner)) {
        const name = nodeOptionName(group)
        if (REPEATABLE_NODE_OPTIONS.has(name)) {
            if (!merged.includes(group)) {
                merged.push(group)
            }
            continue
        }

        const existing = merged.findIndex((item) => nodeOptionName(item) === name)
        if (existing === -1) {
            merged.push(group)
        } else {
            merged[existing] = group
        }
    }

    return merged.join(' ')
}

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

    instances?: Record<string, { sessionId: string }>
    isMultiRemote?: boolean

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
     */
    constructor(
        config: WebdriverIO.Config,
        { cid, configFile, caps, specs, execArgv, retries }: Workers.WorkerRunPayload,
        stdout: WritableStreamBuffer,
        stderr: WritableStreamBuffer,
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

        this.isReady = new Promise((resolve) => { this.isReadyResolver = resolve })
        this.isSetup = new Promise((resolve) => { this.isSetupResolver = resolve })
    }

    /**
     * spawns process to kick of wdio-runner
     */
    async startProcess() {
        const { cid, execArgv } = this
        const argv = process.argv.slice(2)

        const runnerEnv = Object.assign({}, process.env, this.config.runnerEnv, {
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
         * Propagate node flags to the worker, e.g. `--import tsx`.
         * `Object.assign` lets `config.runnerEnv.NODE_OPTIONS` replace the
         * parent value, which would drop the loader the launcher added for
         * TypeScript. Merge the two instead. Append `--enable-source-maps` as
         * a whole token only when this worker should map stack traces and the
         * flag is not already present. Never concatenate an unset parent:
         * that leaked the string `"undefined"`.
         */
        const runnerOverride = this.config.runnerEnv?.NODE_OPTIONS
        const nodeOptions = mergeWorkerNodeOptions(
            process.env.NODE_OPTIONS ?? '',
            typeof runnerOverride === 'string' ? runnerOverride : undefined
        )
        const hasSourceMaps = nodeOptions.split(' ').includes('--enable-source-maps')
        const merged = this.shouldEnableSourceMaps() && !hasSourceMaps
            ? `${nodeOptions} --enable-source-maps`.trim()
            : nodeOptions
        if (merged) {
            runnerEnv.NODE_OPTIONS = merged
        } else {
            delete runnerEnv.NODE_OPTIONS
        }

        log.info(`Start worker ${cid} with arg: ${argv.join(' ')}`)

        const childProcess = this.childProcess = fork(
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

    /**
     * Source maps help debug stack traces but cost worker boot time.
     * Enable for verbose log levels, or when WDIO_SOURCE_MAPS=1.
     */
    private shouldEnableSourceMaps () {
        if (process.env.WDIO_SOURCE_MAPS === '1' || process.env.WDIO_SOURCE_MAPS === 'true') {
            return true
        }
        const level = this.config.logLevel
        return level === 'trace' || level === 'debug'
    }

    private _handleMessage (payload: Workers.WorkerMessage) {
        const { cid, childProcess } = this

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
         * resolve the spec file retry budget as soon as the framework is initialised,
         * which happens after `beforeSession` (so config mutations made in the hook
         * are reflected) but before the session is requested. Without this, a worker
         * that dies before its session ever started (e.g. session creation timed out)
         * would exit still carrying the -1 sentinel and the spec file would never be
         * retried despite `specFileRetries` being set.
         */
        if (payload.name === 'testFrameworkInit' && this.retries === -1 && payload.specFileRetries) {
            this.retries = payload.specFileRetries - 1
        }

        /**
         * store sessionId and connection data to worker instance
         */
        if (payload.name === 'sessionStarted') {
            this.isSetupResolver(true)
            if (this.retries === -1 && payload.specFileRetries) {
                this.retries = payload.specFileRetries - 1
            }
            if (payload.content.isMultiRemote) {
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

        this.emit('message', Object.assign(payload, { cid }))
    }

    private _handleError (payload: Error) {
        const { cid } = this
        this.emit('error', Object.assign(payload, { cid }))
    }

    /**
     * Node calls this with `(code, signal)` where `code` is `null` whenever the
     * worker was terminated by a signal rather than exiting on its own, e.g. on
     * a segmentation fault. Only the second argument identifies that case.
     */
    private _handleExit (exitCode: number | null, signal: NodeJS.Signals | null = null) {
        const { cid, childProcess, specs, retries } = this
        const wasKilledIntentionally = this.isKilled

        /**
         * delete process of worker
         */
        delete this.childProcess
        this.isBusy = false
        this.isKilled = true

        const resolvedExitCode = exitCode ?? getExitCodeForSignal(signal)
        const crashed = signal !== null && !wasKilledIntentionally && !GRACEFUL_SHUTDOWN_SIGNALS.includes(signal)

        /**
         * a crashing worker produces no output of its own, so this is the only
         * chance to tell the user why the spec disappeared
         */
        if (crashed) {
            log.error(
                `Runner ${cid} was terminated by ${signal} and did not report an exit code. ` +
                `The spec file(s) ${specs.join(', ')} are reported as failed with exit code ${resolvedExitCode}. ` +
                'This usually means the process ran out of memory or a native module crashed.'
            )
        } else {
            log.debug(`Runner ${cid} finished with exit code ${resolvedExitCode}`)
        }

        this.emit('exit', { cid, exitCode: resolvedExitCode, specs, retries, signal })

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
    }

    /**
     * sends message to sub process to execute functions in wdio-runner
     * @param  command  method to run in wdio-runner
     * @param  args     arguments for functions to call
     */
    async postMessage (command: string, args: Workers.WorkerMessageArgs | Workers.WorkerRequest['args'], requiresSetup = false): Promise<void> {
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
