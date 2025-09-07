import exitHook from 'async-exit-hook'
import { createRequire } from 'node:module'

import logger from '@wdio/logger'
import { validateConfig } from '@wdio/config'
import { ConfigParser } from '@wdio/config/node'
import { initializePlugin, initializeLauncherService, sleep, enableFileLogging } from '@wdio/utils'
import { setupDriver, setupBrowser } from '@wdio/utils/node'
import type { Capabilities, Services } from '@wdio/types'

import CLInterface from './interface.js'
import { runLauncherHook, runOnCompleteHook, runServiceHook, nodeVersion, type HookError } from './utils.js'
import { TESTRUNNER_DEFAULTS, WORKER_GROUPLOGS_MESSAGES } from './constants.js'
import type { RunCommandArguments } from './types.js'
const log = logger('@wdio/cli:launcher')
const require = createRequire(import.meta.url)

interface Schedule {
    cid: number
    caps: WebdriverIO.Capabilities
    specs: WorkerSpecs[]
    availableInstances: number
    runningInstances: number
}

interface WorkerSpecs {
    files: string[]
    retries: number
    rid?: string
}

export interface EndMessage {
    cid: string, // is actually rid
    exitCode: number,
    specs: string[],
    retries: number
}

const TS_FILE_EXTENSIONS = ['.ts', '.tsx', '.mts', '.cts']

class Launcher {
    #isInitialized: boolean = false

    public configParser: ConfigParser
    public isMultiremote = false
    public isParallelMultiremote = false
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
     * @return  {Promise}  that only gets resolved with either an exitCode or an error
     */
    async run(): Promise<undefined | number> {
        await this.initialize()
        const config = this.configParser.getConfig()

        const capabilities = this.configParser.getCapabilities()
        this.isParallelMultiremote = Array.isArray(capabilities) &&
            capabilities.every(cap => Object.values(cap).length > 0 && Object.values(cap).every(c => typeof c === 'object' && (c as { capabilities: WebdriverIO.Capabilities }).capabilities))
        this.isMultiremote = this.isParallelMultiremote || !Array.isArray(capabilities)
        validateConfig(TESTRUNNER_DEFAULTS, { ...config, capabilities })

        await enableFileLogging(config.outputDir)
        logger.setLogLevelsConfig(config.logLevels, config.logLevel)

        /**
         * For Parallel-Multiremote, only get the specs and excludes from the first object
         */
        const totalWorkerCnt = Array.isArray(capabilities)
            ? capabilities
                .map((c) => {
                    if (this.isParallelMultiremote) {
                        const keys = Object.keys(c as Capabilities.RequestedMultiremoteCapabilities)
                        const caps = (c as Capabilities.RequestedMultiremoteCapabilities)[keys[0]].capabilities as WebdriverIO.Capabilities
                        return this.configParser.getSpecs(caps['wdio:specs'], caps['wdio:exclude']).length
                    }
                    const standaloneCaps = c as Capabilities.RequestedStandaloneCapabilities
                    const cap = 'alwaysMatch' in standaloneCaps ? standaloneCaps.alwaysMatch : standaloneCaps
                    return this.configParser.getSpecs(cap['wdio:specs'], cap['wdio:exclude']).length
                })
                .reduce((a, b) => a + b, 0)
            : 1

        this.interface = new CLInterface(config, totalWorkerCnt, this._isWatchMode)
        config.runnerEnv!.FORCE_COLOR = Number(this.interface.hasAnsiSupport).toString()

        const [runnerName, runnerOptions] = Array.isArray(config.runner) ? config.runner : [config.runner, {} as WebdriverIO.BrowserRunnerOptions]
        const Runner = (await initializePlugin(runnerName, 'runner') as Services.RunnerPlugin).default
        this.runner = new Runner(runnerOptions, config)

        /**
         * catches ctrl+c event
         */
        exitHook(this._exitHandler.bind(this))
        let exitCode = 0
        let error: HookError | undefined = undefined
        const caps = this.configParser.getCapabilities() as Capabilities.TestrunnerCapabilities

        try {
            const { ignoredWorkerServices, launcherServices } = await initializeLauncherService(config, caps)
            this._launcher = launcherServices
            this._args.ignoredWorkerServices = ignoredWorkerServices

            /**
             * run pre test tasks for runner plugins
             * (e.g. deploy Lambda function to AWS)
             */
            await this.runner.initialize()

            /**
             * run onPrepare hook
             */
            log.info('Run onPrepare hook')
            await runLauncherHook(config.onPrepare, config, caps)
            await runServiceHook(this._launcher, 'onPrepare', config, caps)

            /**
             * pre-configure necessary driver for worker threads
             */
            await Promise.all([
                setupDriver(config, caps),
                setupBrowser(config, caps)
            ])

            exitCode = await this._runMode(config, caps)
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

            exitCode = await this.#runOnCompleteHook(config, caps, exitCode)
        }

        if (error) {
            this.interface.logHookError(error)
            throw error
        }

        return exitCode
    }

    /**
     * initialize launcher by loading `tsx` if needed
     */
    async initialize () {
        /**
         * only initialize once
         */
        if (this.#isInitialized) {
            return
        }

        /**
         * add tsx to process NODE_OPTIONS so it will be passed along the worker process
         */
        const tsxPath = require.resolve('tsx')
        if (!process.env.NODE_OPTIONS || !process.env.NODE_OPTIONS.includes(tsxPath)) {
            /**
             * The `--import` flag is only available in Node 20.6.0 / 18.19.0 and later.
             * This switching can be removed once the minimum supported version of Node exceeds 20.6.0 / 18.19.0
             * see https://nodejs.org/api/module.html#customization-hooks and https://tsx.is/dev-api/node-cli#module-mode-only
             */
            const moduleLoaderFlag = nodeVersion('major') >= 21 ||
                (nodeVersion('major') === 20 && nodeVersion('minor') >= 6) ||
                (nodeVersion('major') === 18 && nodeVersion('minor') >= 19) ? '--import' : '--loader'
            process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} ${moduleLoaderFlag} ${tsxPath}`
        }

        /**
         * load tsx in the main process if config file is a .ts file to allow config parser to load it
         */
        if (TS_FILE_EXTENSIONS.some((ext) => this._configFilePath.endsWith(ext))) {
            await import(tsxPath)
        }

        this.#isInitialized = true

        /**
         * initialize config parser
         */
        await this.configParser.initialize(this._args)
    }

    /**
     * run onComplete hook
     * Even if it fails we still want to see result and end logger stream.
     * Also ensure that user hooks are run before service hooks so that e.g.
     * a user can use plugin service, e.g. shared store service is still
     * available running hooks in this order
     */
    async #runOnCompleteHook (
        config: Required<WebdriverIO.Config>,
        caps: Capabilities.TestrunnerCapabilities,
        exitCode: number
    ): Promise<number> {
        log.info('Run onComplete hook')
        const onCompleteResults = await runOnCompleteHook(config.onComplete!, config, caps, exitCode, this.interface!.result)
        if (this._launcher) {
            await runServiceHook(this._launcher, 'onComplete', exitCode, config, caps)
        }

        // if any of the onComplete hooks failed, update the exit code
        return onCompleteResults.includes(1) ? 1 : exitCode
    }

    /**
     * run without triggering onPrepare/onComplete hooks
     */
    private _runMode(config: Required<WebdriverIO.Config>, caps?: Capabilities.TestrunnerCapabilities): Promise<number> {
        /**
         * fail if
         */
        if (
            /**
             * no caps were provided
             */
            !caps ||
            /**
             * capability array is empty
             */
            (Array.isArray(caps) && caps.length === 0) ||
            /**
             * user wants to use multiremote but capability object is empty
             */
            (!Array.isArray(caps) && Object.keys(caps).length === 0)
        ) {
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
        if (this.isMultiremote && !this.isParallelMultiremote) {
            /**
             * Multiremote mode
             */
            this._schedule.push({
                cid: cid++,
                caps: caps as Capabilities.RequestedMultiremoteCapabilities,
                specs: this._formatSpecs(caps as Capabilities.RequestedMultiremoteCapabilities, specFileRetries),
                availableInstances: config.maxInstances || 1,
                runningInstances: 0
            })
        } else {
            /**
             * Regular mode & Parallel Multiremote
             */
            for (const capabilities of caps as Capabilities.RequestedStandaloneCapabilities[]) {
                /**
                 * when using browser runner we only allow one session per browser
                 */
                const availableInstances = this.isParallelMultiremote ? config.maxInstances || 1 : config.runner === 'browser'
                    ? 1
                    : (capabilities as WebdriverIO.Capabilities)['wdio:maxInstances'] || config.maxInstancesPerCapability

                this._schedule.push({
                    cid: cid++,
                    caps: capabilities as WebdriverIO.Capabilities,
                    specs: this._formatSpecs(capabilities, specFileRetries),
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
                const { total, current } = config.shard
                if (total > 1) {
                    log.info(`No specs to execute in shard ${current}/${total}, exiting!`)
                    return resolve(0)
                }

                log.error('No specs found to run, exiting with failure')
                return resolve(1)
            }

            /**
             * return immediately if no spec was run
             */
            if (this._runSpecs()) {
                resolve(0)
            }
        })
    }

    /**
     * Format the specs into an array of objects with files and retries
     */
    private _formatSpecs(capabilities: (Capabilities.RequestedMultiremoteCapabilities | Capabilities.RequestedStandaloneCapabilities), specFileRetries: number) {
        let caps: WebdriverIO.Capabilities
        if ('alwaysMatch' in capabilities) {
            caps = capabilities.alwaysMatch as WebdriverIO.Capabilities
        } else if (typeof Object.keys(capabilities)[0] === 'object' && 'capabilities' in (capabilities as Capabilities.RequestedMultiremoteCapabilities)[Object.keys(capabilities)[0]]) {
            caps = {} as WebdriverIO.Capabilities
        } else {
            caps = capabilities as WebdriverIO.Capabilities
        }
        const specs = (
            // @ts-expect-error deprecated
            caps.specs ||
            caps['wdio:specs']
        )
        const excludes = (
            // @ts-expect-error deprecated
            caps.exclude ||
            caps['wdio:exclude']
        )
        const files = this.configParser.getSpecs(specs, excludes)

        return files.map((file: string | string[]) => {
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
    private _runSpecs(): boolean {
        /**
         * stop spawning new processes when CTRL+C was triggered
         */
        if (this._hasTriggeredExitRoutine) {
            return true
        }

        const config = this.configParser.getConfig()

        while (this._getNumberOfRunningInstances() < config.maxInstances) {
            const schedulableCaps = this._schedule
                /**
                 * bail if number of errors exceeds allowed
                 */
                .filter((session) => {
                    const filter = typeof config.bail !== 'number' || config.bail < 1 ||
                        config.bail > this._runnerFailed

                    /**
                     * clear number of specs when filter is false
                     */
                    if (!filter) {
                        this._schedule.forEach((t) => { t.specs = [] })
                        return false
                    }

                    /**
                     * make sure complete number of running instances is not higher than general maxInstances number
                     */
                    if (this._getNumberOfRunningInstances() >= config.maxInstances) {
                        return false
                    }

                    /**
                     * make sure the capability has available capacities and still has caps to run
                     */
                    return session.availableInstances > 0 && session.specs.length > 0
                })
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
            this._startInstance(
                specs.files,
                schedulableCaps[0].caps as Capabilities.ResolvedTestrunnerCapabilities,
                schedulableCaps[0].cid,
                specs.rid,
                specs.retries
            )
            schedulableCaps[0].availableInstances--
            schedulableCaps[0].runningInstances++
        }

        return this._getNumberOfRunningInstances() === 0 && this._getNumberOfSpecsLeft() === 0
    }

    /**
     * gets number of all running instances
     * @return {number} number of running instances
     */
    private _getNumberOfRunningInstances(): number {
        return this._schedule.map((a) => a.runningInstances).reduce((a, b) => a + b)
    }

    /**
     * get number of total specs left to complete whole suites
     * @return {number} specs left to complete suite
     */
    private _getNumberOfSpecsLeft(): number {
        return this._schedule.map((a) => a.specs.length).reduce((a, b) => a + b)
    }

    /**
     * Start instance in a child process.
     * @param  {Array} specs  Specs to run
     * @param  {number} cid  Capabilities ID
     * @param  {string} rid  Runner ID override
     * @param  {number} retries  Number of retries remaining
     */
    private async _startInstance(
        specs: string[],
        caps: Capabilities.ResolvedTestrunnerCapabilities,
        cid: number,
        rid: string | undefined,
        retries: number
    ) {
        if (!this.runner || !this.interface) {
            throw new Error('Internal Error: no runner initialized, call run() first')
        }

        const config = this.configParser.getConfig()

        // wait before retrying the spec file
        if (typeof config.specFileRetriesDelay === 'number' && config.specFileRetries > 0 && config.specFileRetries !== retries) {
            await sleep(config.specFileRetriesDelay * 1000)
        }

        // Retried tests receive the cid of the failing test as rid
        // so they can run with the same cid of the failing test.
        const runnerId = rid || this._getRunnerId(cid)
        const processNumber = this._runnerStarted + 1

        // process.debugPort defaults to 5858 and is set even when process
        // is not being debugged.
        const debugArgs = []
        let debugType
        let debugHost = ''
        const debugPort = process.debugPort
        for (const arg of process.execArgv) {
            const debugArgs = arg.match('--(debug|inspect)(?:-brk)?(?:=(.*):)?')
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

        // Prepare to pass different capability objects for each worker
        const workerCaps = structuredClone(caps)

        // run worker hook to allow modify runtime and capabilities of a specific worker
        log.info('Run onWorkerStart hook')
        await runLauncherHook(config.onWorkerStart, runnerId, workerCaps, specs, this._args, execArgv)
            .catch((error) => this._workerHookError(error))
        await runServiceHook(this._launcher!, 'onWorkerStart', runnerId, workerCaps, specs, this._args, execArgv)
            .catch((error) => this._workerHookError(error))

        // prefer launcher settings in capabilities over general launcher
        const worker = await this.runner.run({
            cid: runnerId,
            command: 'run',
            configFile: this._configFilePath,
            args: {
                ...this._args,
                /**
                 * Pass on user and key values to ensure they are available in the worker process when using
                 * environment variables that were locally exported but not part of the environment.
                 */
                user: config.user,
                key: config.key
            },
            caps: workerCaps,
            specs,
            execArgv,
            retries
        })
        worker.on('message', this.interface.onMessage.bind(this.interface))
        worker.on('error', this.interface.onMessage.bind(this.interface))
        worker.on('exit', (code) => {
            if (!this.configParser.getConfig().groupLogsByTestSpec) {
                return
            }
            if (code.exitCode === 0) {
                console.log(WORKER_GROUPLOGS_MESSAGES.normalExit(code.cid))
            } else {
                console.log(WORKER_GROUPLOGS_MESSAGES.exitWithError(code.cid))
            }
            worker.logsAggregator.forEach((logLine) => {
                console.log(logLine.replace(new RegExp('\\n$'), ''))
            })
        })
        worker.on('exit', this._endHandler.bind(this))
    }

    private _workerHookError(error: HookError) {
        if (!this.interface) {
            throw new Error('Internal Error: no interface initialized, call run() first')
        }

        this.interface.logHookError(error)
        if (this._resolve) {
            this._resolve(1)
        }
    }

    /**
     * generates a runner id
     * @param  {number} cid capability id (unique identifier for a capability)
     * @return {String}     runner id (combination of cid and test id e.g. 0a, 0b, 1a, 1b ...)
     */
    private _getRunnerId(cid: number): string {
        if (!this._rid[cid]) {
            this._rid[cid] = 0
        }
        return `${cid}-${this._rid[cid]++}`
    }

    /**
     * Close test runner process once all child processes have exited
     * @param  {number} cid       Capabilities ID
     * @param  {number} exitCode  exit code of child process
     * @param  {Array} specs      Specs that were run
     * @param  {number} retries   Number or retries remaining
     */
    private async _endHandler({ cid: rid, exitCode, specs, retries }: EndMessage): Promise<void> {
        const passed = this._isWatchModeHalted() || exitCode === 0

        if (!passed && retries > 0) {
            // Default is true, so test for false explicitly
            const requeue = this.configParser.getConfig().specFileRetriesDeferred ? 'push' : 'unshift'
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
        const shouldRunSpecs = this._runSpecs()
        const inWatchMode = this._isWatchMode && !this._hasTriggeredExitRoutine
        if (!shouldRunSpecs || inWatchMode) {
            /**
             * print reporter results when in watch mode
             */
            if (inWatchMode) {
                this.interface?.finalise()
            }

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
    private _exitHandler(callback?: (value: boolean) => void): void | Promise<void> {
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
    private _isWatchModeHalted(): boolean {
        return this._isWatchMode && this._hasTriggeredExitRoutine
    }
}

export default Launcher
