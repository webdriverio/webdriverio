import fs from 'node:fs/promises'
import path from 'node:path'
import exitHook from 'async-exit-hook'

import logger from '@wdio/logger'
import { ConfigParser } from '@wdio/config'
import { initialisePlugin, initialiseLauncherService, sleep } from '@wdio/utils'
import type { Options, Capabilities, Services } from '@wdio/types'

import CLInterface from './interface.js'
import type { HookError } from './utils.js'
import { runLauncherHook, runOnCompleteHook, runServiceHook } from './utils.js'
import type { RunCommandArguments } from './types.js'

const log = logger('@wdio/cli:launcher')

interface Schedule {
    cid: number
    caps: Capabilities.Capabilities
    specs: WorkerSpecs[]
    availableInstances: number
    runningInstances: number
}

interface WorkerSpecs {
    files: string[]
    retries: number
    rid?: string
}

interface EndMessage {
    cid: string, // is actually rid
    exitCode: number,
    specs: string[],
    retries: number
}

class Launcher {
    public configParser: ConfigParser
    public isMultiremote = false
    public runner?: Services.RunnerInstance
    public interface?: CLInterface

    private _exitCode = 0
    private _hasTriggeredExitRoutine = false
    private _schedule: Schedule[] = []
    private _rid: number[] = []
    private _runnerStarted = 0
    private _runnerFailed = 0

    private _launcher?: Services.ServiceInstance[]
    private _resolve?: Function

    constructor(
        private _configFilePath: string,
        private _args: Partial<RunCommandArguments> = {},
        private _isWatchMode = false
    ) {
        this.configParser = new ConfigParser(this._configFilePath, this._args)
    }

    /**
     * run sequence
     * @return  {Promise}  that only gets resolves with either an exitCode or an error
     */
    async run() {
        await this.configParser.initialize(this._args)
        const config = this.configParser.getConfig()

        /**
         * assign parsed autocompile options into args so it can be used within the worker
         * without having to read the config again
         */
        this._args.autoCompileOpts = config.autoCompileOpts

        const capabilities = this.configParser.getCapabilities() as (Capabilities.Capabilities | Capabilities.W3CCapabilities | Capabilities.MultiRemoteCapabilities)
        this.isMultiremote = !Array.isArray(capabilities)

        if (config.outputDir) {
            await fs.mkdir(path.join(config.outputDir), { recursive: true })
            process.env.WDIO_LOG_PATH = path.join(config.outputDir, 'wdio.log')
        }

        logger.setLogLevelsConfig(config.logLevels, config.logLevel)

        const totalWorkerCnt = Array.isArray(capabilities)
            ? capabilities
                .map((c: Capabilities.DesiredCapabilities) => this.configParser.getSpecs(c.specs, c.exclude).length)
                .reduce((a, b) => a + b, 0)
            : 1

        this.interface = new CLInterface(config, totalWorkerCnt, this._isWatchMode)
        config.runnerEnv!.FORCE_COLOR = Number(this.interface.hasAnsiSupport)

        const [runnerName, runnerOptions] = Array.isArray(config.runner) ? config.runner : [config.runner, {} as WebdriverIO.BrowserRunnerOptions]
        const Runner = (await initialisePlugin(runnerName, 'runner') as Services.RunnerPlugin).default
        this.runner = new Runner(runnerOptions, config)

        /**
         * catches ctrl+c event
         */
        exitHook(this.exitHandler.bind(this))
        let exitCode = 0
        let error: HookError | undefined = undefined

        try {
            const caps = this.configParser.getCapabilities() as Capabilities.RemoteCapabilities
            const { ignoredWorkerServices, launcherServices } = await initialiseLauncherService(config, caps as Capabilities.DesiredCapabilities)
            this._launcher = launcherServices
            this._args.ignoredWorkerServices = ignoredWorkerServices

            /**
             * run pre test tasks for runner plugins
             * (e.g. deploy Lambda function to AWS)
             */
            await this.runner.initialise()

            /**
             * run onPrepare hook
             */
            log.info('Run onPrepare hook')
            await runLauncherHook(config.onPrepare, config, caps)
            await runServiceHook(this._launcher, 'onPrepare', config, caps)

            exitCode = await this.runMode(config, caps)

            /**
             * run onComplete hook
             * Even if it fails we still want to see result and end logger stream.
             * Also ensure that user hooks are run before service hooks so that e.g.
             * a user can use plugin service, e.g. shared store service is still
             * available running hooks in this order
             */
            log.info('Run onComplete hook')
            const onCompleteResults = await runOnCompleteHook(config.onComplete!, config, caps, exitCode, this.interface.result)
            await runServiceHook(this._launcher, 'onComplete', exitCode, config, caps)

            // if any of the onComplete hooks failed, update the exit code
            exitCode = onCompleteResults.includes(1) ? 1 : exitCode

            await logger.waitForBuffer()

            this.interface.finalise()
        } catch (err) {
            error = err as HookError
        } finally {
            if (!this._hasTriggeredExitRoutine) {
                this._hasTriggeredExitRoutine = true
                const passesCodeCoverage = await this.runner.shutdown()
                if (!passesCodeCoverage) {
                    exitCode = exitCode || 1
                }
            }
        }

        if (error) {
            this.interface.logHookError(error)
            throw error
        }
        return exitCode
    }

    /**
     * run without triggering onPrepare/onComplete hooks
     */
    runMode (config: Required<Options.Testrunner>, caps: Capabilities.RemoteCapabilities): Promise<number> {
        /**
         * fail if no caps were found
         */
        if (!caps) {
            return new Promise((resolve) => {
                log.error('Missing capabilities, exiting with failure')
                return resolve(1)
            })
        }

        /**
         * avoid retries in watch mode
         */
        const specFileRetries = this._isWatchMode ? 0 : config.specFileRetries

        /**
         * schedule test runs
         */
        let cid = 0
        if (this.isMultiremote) {
            /**
             * Multiremote mode
             */
            this._schedule.push({
                cid: cid++,
                caps: caps as Capabilities.MultiRemoteCapabilities,
                specs: this.formatSpecs(caps, specFileRetries),
                availableInstances: config.maxInstances || 1,
                runningInstances: 0
            })
        } else {
            /**
             * Regular mode
             */
            for (const capabilities of caps as (Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities)[]) {
                /**
                 * when using browser runner we only allow one session per browser
                 */
                const availableInstances = config.runner === 'browser'
                    ? 1
                    : (capabilities as Capabilities.DesiredCapabilities).maxInstances || config.maxInstancesPerCapability

                this._schedule.push({
                    cid: cid++,
                    caps: capabilities as Capabilities.Capabilities,
                    specs: this.formatSpecs(capabilities, specFileRetries),
                    availableInstances,
                    runningInstances: 0
                })
            }
        }

        return new Promise<number>((resolve) => {
            this._resolve = resolve

            /**
             * fail if no specs were found or specified
             */
            if (Object.values(this._schedule).reduce((specCnt, schedule) => specCnt + schedule.specs.length, 0) === 0) {
                log.error('No specs found to run, exiting with failure')
                return resolve(1)
            }

            /**
             * return immediately if no spec was run
             */
            if (this.runSpecs()) {
                resolve(0)
            }
        })
    }

    /**
     * Format the specs into an array of objects with files and retries
     */
    formatSpecs(capabilities: (Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities | Capabilities.RemoteCapabilities), specFileRetries: number) {
        const files = this.configParser.getSpecs((capabilities as Capabilities.DesiredCapabilities).specs, (capabilities as Capabilities.DesiredCapabilities).exclude)

        return files.map(file => {
            if (typeof file === 'string') {
                return { files: [file], retries: specFileRetries }
            } else if (Array.isArray(file)) {
                return { files: file, retries: specFileRetries }
            }
            log.warn('Unexpected entry in specs that is neither string nor array: ', file)
            // Returning an empty structure to avoid undefined
            return { files: [], retries: specFileRetries }
        })
    }

    /**
     * run multiple single remote tests
     * @return {Boolean} true if all specs have been run and all instances have finished
     */
    runSpecs() {
        /**
         * stop spawning new processes when CTRL+C was triggered
         */
        if (this._hasTriggeredExitRoutine) {
            return true
        }

        const config = this.configParser.getConfig()

        while (this.getNumberOfRunningInstances() < config.maxInstances) {
            const schedulableCaps = this._schedule
                /**
                 * bail if number of errors exceeds allowed
                 */
                .filter(() => {
                    const filter = typeof config.bail !== 'number' || config.bail < 1 ||
                        config.bail > this._runnerFailed

                    /**
                     * clear number of specs when filter is false
                     */
                    if (!filter) {
                        this._schedule.forEach((t) => { t.specs = [] })
                    }

                    return filter
                })
                /**
                 * make sure complete number of running instances is not higher than general maxInstances number
                 */
                .filter(() => this.getNumberOfRunningInstances() < config.maxInstances)
                /**
                 * make sure the capability has available capacities
                 */
                .filter((a) => a.availableInstances > 0)
                /**
                 * make sure capability has still caps to run
                 */
                .filter((a) => a.specs.length > 0)
                /**
                 * make sure we are running caps with less running instances first
                 */
                .sort((a, b) => a.runningInstances - b.runningInstances)

            /**
             * continue if no capability were schedulable
             */
            if (schedulableCaps.length === 0) {
                break
            }

            const specs = schedulableCaps[0].specs.shift() as NonNullable<WorkerSpecs>
            this.startInstance(
                specs.files,
                schedulableCaps[0].caps as Capabilities.DesiredCapabilities,
                schedulableCaps[0].cid,
                specs.rid,
                specs.retries
            )
            schedulableCaps[0].availableInstances--
            schedulableCaps[0].runningInstances++
        }

        return this.getNumberOfRunningInstances() === 0 && this.getNumberOfSpecsLeft() === 0
    }

    /**
     * gets number of all running instances
     * @return {number} number of running instances
     */
    getNumberOfRunningInstances() {
        return this._schedule.map((a) => a.runningInstances).reduce((a, b) => a + b)
    }

    /**
     * get number of total specs left to complete whole suites
     * @return {number} specs left to complete suite
     */
    getNumberOfSpecsLeft() {
        return this._schedule.map((a) => a.specs.length).reduce((a, b) => a + b)
    }

    /**
     * Start instance in a child process.
     * @param  {Array} specs  Specs to run
     * @param  {Number} cid  Capabilities ID
     * @param  {String} rid  Runner ID override
     * @param  {Number} retries  Number of retries remaining
     */
    async startInstance(
        specs: string[],
        caps: Capabilities.DesiredCapabilities | Capabilities.W3CCapabilities | Capabilities.MultiRemoteCapabilities,
        cid: number,
        rid: string | undefined,
        retries: number
    ) {
        if (!this.runner || !this.interface) {
            throw new Error('Internal Error: no runner initialised, call run() first')
        }

        const config = this.configParser.getConfig()

        // wait before retrying the spec file
        if (typeof config.specFileRetriesDelay === 'number' && config.specFileRetries > 0 && config.specFileRetries !== retries) {
            await sleep(config.specFileRetriesDelay * 1000)
        }

        // Retried tests receive the cid of the failing test as rid
        // so they can run with the same cid of the failing test.
        const runnerId = rid || this.getRunnerId(cid)
        const processNumber = this._runnerStarted + 1

        // process.debugPort defaults to 5858 and is set even when process
        // is not being debugged.
        const debugArgs = []
        let debugType
        let debugHost = ''
        const debugPort = process.debugPort
        for (const i in process.execArgv) {
            const debugArgs = process.execArgv[i].match('--(debug|inspect)(?:-brk)?(?:=(.*):)?')
            if (debugArgs) {
                const [, type, host] = debugArgs
                if (type) {
                    debugType = type
                }
                if (host) {
                    debugHost = `${host}:`
                }
            }
        }

        if (debugType) {
            debugArgs.push(`--${debugType}=${debugHost}${(debugPort + processNumber)}`)
        }

        // if you would like to add --debug-brk, use a different port, etc...
        const capExecArgs = [...(config.execArgv || [])]

        // The default value for child.fork execArgs is process.execArgs,
        // so continue to use this unless another value is specified in config.
        const defaultArgs = (capExecArgs.length) ? process.execArgv : []

        // If an arg appears multiple times the last occurrence is used
        const execArgv = [...defaultArgs, ...debugArgs, ...capExecArgs]

        // bump up worker count
        this._runnerStarted++

        // run worker hook to allow modify runtime and capabilities of a specific worker
        log.info('Run onWorkerStart hook')
        await runLauncherHook(config.onWorkerStart, runnerId, caps, specs, this._args, execArgv)
            .catch((error) => this._workerHookError(error))
        await runServiceHook(this._launcher!, 'onWorkerStart', runnerId, caps, specs, this._args, execArgv)
            .catch((error) => this._workerHookError(error))

        // prefer launcher settings in capabilities over general launcher
        const worker = this.runner.run({
            cid: runnerId,
            command: 'run',
            configFile: this._configFilePath,
            args: {
                ...this._args,
                ...(config?.autoCompileOpts
                    ? { autoCompileOpts: config.autoCompileOpts }
                    : {}
                ),
                /**
                 * Pass on user and key values to ensure they are available in the worker process when using
                 * environment variables that were locally exported but not part of the environment.
                 */
                user: config.user,
                key: config.key
            },
            caps,
            specs,
            execArgv,
            retries
        })
        worker.on('message', this.interface.onMessage.bind(this.interface))
        worker.on('error', this.interface.onMessage.bind(this.interface))
        worker.on('exit', this.endHandler.bind(this))
    }

    private _workerHookError (error: HookError) {
        if (!this.interface) {
            throw new Error('Internal Error: no interface initialised, call run() first')
        }

        this.interface.logHookError(error)
        if (this._resolve) {
            this._resolve(1)
        }
    }

    /**
     * generates a runner id
     * @param  {Number} cid capability id (unique identifier for a capability)
     * @return {String}     runner id (combination of cid and test id e.g. 0a, 0b, 1a, 1b ...)
     */
    getRunnerId (cid: number) {
        if (!this._rid[cid]) {
            this._rid[cid] = 0
        }
        return `${cid}-${this._rid[cid]++}`
    }

    /**
     * Close test runner process once all child processes have exited
     * @param  {Number} cid       Capabilities ID
     * @param  {Number} exitCode  exit code of child process
     * @param  {Array} specs      Specs that were run
     * @param  {Number} retries   Number or retries remaining
     */
    async endHandler({ cid: rid, exitCode, specs, retries }: EndMessage) {
        const passed = this._isWatchModeHalted() || exitCode === 0

        if (!passed && retries > 0) {
            // Default is true, so test for false explicitly
            const requeue = this.configParser.getConfig().specFileRetriesDeferred !== false ? 'push' : 'unshift'
            this._schedule[parseInt(rid, 10)].specs[requeue]({ files: specs, retries: retries - 1, rid })
        } else {
            this._exitCode = this._isWatchModeHalted() ? 0 : this._exitCode || exitCode
            this._runnerFailed += !passed ? 1 : 0
        }

        /**
         * avoid emitting job:end if watch mode has been stopped by user
         */
        if (!this._isWatchModeHalted() && this.interface) {
            this.interface.emit('job:end', { cid: rid, passed, retries })
        }

        /**
         * Update schedule now this process has ended
         * get cid (capability id) from rid (runner id)
         */
        const cid = parseInt(rid, 10)

        this._schedule[cid].availableInstances++
        this._schedule[cid].runningInstances--

        log.info('Run onWorkerEnd hook')
        const config = this.configParser.getConfig()
        await runLauncherHook(config.onWorkerEnd, rid, exitCode, specs, retries)
            .catch((error) => this._workerHookError(error))
        await runServiceHook(this._launcher!, 'onWorkerEnd', rid, exitCode, specs, retries)
            .catch((error) => this._workerHookError(error))

        /**
         * do nothing if
         * - there are specs to be executed
         * - we are running watch mode
         */
        const shouldRunSpecs = this.runSpecs()
        if (!shouldRunSpecs || (this._isWatchMode && !this._hasTriggeredExitRoutine)) {
            return
        }

        if (this._resolve) {
            this._resolve(passed ? this._exitCode : 1)
        }
    }

    /**
     * We need exitHandler to catch SIGINT / SIGTERM events.
     * Make sure all started selenium sessions get closed properly and prevent
     * having dead driver processes. To do so let the runner end its Selenium
     * session first before killing
     */
    exitHandler (callback?: (value: boolean) => void) {
        if (!callback || !this.runner || !this.interface) {
            return
        }

        if (this._hasTriggeredExitRoutine) {
            return callback(true)
        }

        this._hasTriggeredExitRoutine = true
        this.interface.sigintTrigger()
        return this.runner.shutdown().then(callback)
    }

    /**
     * returns true if user stopped watch mode, ex with ctrl+c
     * @returns {boolean}
     */
    private _isWatchModeHalted () {
        return this._isWatchMode && this._hasTriggeredExitRoutine
    }
}

export default Launcher
