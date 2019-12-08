import path from 'path'
import fs from 'fs-extra'
import exitHook from 'async-exit-hook'

import logger from '@wdio/logger'
import { ConfigParser } from '@wdio/config'
import { initialisePlugin, initialiseServices } from '@wdio/utils'

import CLInterface from './interface'
import { runOnPrepareHook, runOnCompleteHook, runServiceHook } from './utils'

const log = logger('@wdio/cli:launcher')

class Launcher {
    constructor (configFilePath, argv = {}, isWatchMode = false) {
        this.argv = argv
        this.configFilePath = configFilePath

        // Create new instance of ConfigParser.
        this.configParser = new ConfigParser()
        // Add local wdio.conf.js to file
        this.configParser.addConfigFile(configFilePath)
        // Add any CLI args
        this.configParser.merge(argv)

        // Get new config file.
        const config = this.configParser.getConfig()
        const capabilities = this.configParser.getCapabilities()
        const specs = this.configParser.getSpecs()

        this.isWatchMode = isWatchMode

        if (config.outputDir) {
            fs.ensureDirSync(path.join(config.outputDir))
            process.env.WDIO_LOG_PATH = path.join(config.outputDir, 'wdio.log')
        }

        logger.setLogLevelsConfig(config.logLevels, config.logLevel)

        const totalWorkerCnt = Array.isArray(capabilities)
            ? capabilities
                .map((c) => this.configParser.getSpecs(c.specs, c.exclude).length)
                .reduce((a, b) => a + b, 0)
            : 1

        // Create runner instance. config.runner is the name of the package
        // that will be run. As of Dec 2019 only runner: local is used,
        // in the future there is lamda is possible.
        //
        // Create runner object using initialisePlugin, e.g.
        // initialisePlugin('local','runner') or initialisePlugin('lambda','runner') 
        //
        // initialisePlugin returns an object from the runner index.js, e.g.
        // @wdio/local-runner index.js      
        const Runner = initialisePlugin(config.runner, 'runner')
        this.runner = new Runner(configFilePath, config)

        // The interface stores messages received from other worker processes.
        this.interface = new CLInterface(config, specs, totalWorkerCnt, this.isWatchMode)
        config.runnerEnv.FORCE_COLOR = Number(this.interface.hasAnsiSupport)

        this.isMultiremote = !Array.isArray(capabilities)
        this.exitCode = 0
        // If false tests are running, if true then the exit code will be called.
        this.hasTriggeredExitRoutine = false
        this.hasStartedAnyProcess = false
        // Test schedule
        this.schedule = []
        this.rid = []
        // Runner started is incremented every time a spec is executed.
        this.runnerStarted = 0
        // Incremented every time a spec fails.
        this.runnerFailed = 0
    }

    /**
     * run sequence
     * @return  {Promise}               that only gets resolves with either an exitCode or an error
     */
    async run () {
        /**
         * catches ctrl+c event
         */
        exitHook(::this.exitHandler)
        let exitCode
        let error

        try {
            const config = this.configParser.getConfig()
            const caps = this.configParser.getCapabilities()
            const launcher = initialiseServices(config, caps, 'launcher')

            /**
             * run pre test tasks for runner plugins
             * (e.g. deploy Lambda function to AWS)
             */
            await this.runner.initialise()

            /**
             * run onPrepare hook
             */
            log.info('Run onPrepare hook')
            await runOnPrepareHook(config.onPrepare, config, caps)
            await runServiceHook(launcher, 'onPrepare', config, caps)

            exitCode = await this.runMode(config, caps)

            /**
             * run onComplete hook
             * even if it fails we still want to see result and end logger stream
             */
            log.info('Run onComplete hook')
            await runServiceHook(launcher, 'onComplete', exitCode, config, caps)

            const onCompleteResults = await runOnCompleteHook(config.onComplete, config, caps, exitCode, this.interface.result)

            // if any of the onComplete hooks failed, update the exit code
            exitCode = onCompleteResults.includes(1) ? 1 : exitCode

            await logger.waitForBuffer()

            this.interface.finalise()
        } catch (err) {
            error = err
        } finally {
            if (!this.hasTriggeredExitRoutine) {
                this.hasTriggeredExitRoutine = true
                await this.runner.shutdown()
            }
        }

        if (error) {
            throw error
        }
        return exitCode
    }

    /**
     * run without triggering onPrepare/onComplete hooks.
     * 1. Fail if capabilities not defined.
     * 2. Schedule test runs.
     * 3. Call runSpecs, exit once runSpecs returns true.
     * runSpecs will return true when all schedule caps or tests have been executed.
     */
    runMode (config, caps) {
        /**
         * fail if no caps were found
         */
        if (!caps || (!this.isMultiremote && !caps.length)) {
            return new Promise((resolve) => {
                log.error('Missing capabilities, exiting with failure')
                return resolve(1)
            })
        }

        /**
         * avoid retries in watch mode
         */
        const specFileRetries = this.isWatchMode ? 0 : config.specFileRetries

        /**
         * schedule test runs
         */ 
        let cid = 0
        if (this.isMultiremote) {
            /**
             * Multiremote mode
             */
            this.schedule.push({
                cid: cid++,
                caps,
                specs: this.configParser.getSpecs(caps.specs, caps.exclude).map(s => ({ files: [s], retries: specFileRetries })),
                availableInstances: config.maxInstances || 1,
                runningInstances: 0
            })
        } else {
            /**
             * Regular mode
             */
            for (let capabilities of caps) {
                this.schedule.push({
                    cid: cid++,
                    caps: capabilities,
                    specs: this.configParser.getSpecs(capabilities.specs, capabilities.exclude).map(s => ({ files: [s], retries: specFileRetries })),
                    availableInstances: capabilities.maxInstances || config.maxInstancesPerCapability,
                    runningInstances: 0,
                    seleniumServer: { hostname: config.hostname, port: config.port, protocol: config.protocol }
                })
            }
        }

        return new Promise((resolve) => {
            this.resolve = resolve

            /**
             * fail if no specs were found or specified
             */
            if (Object.values(this.schedule).reduce((specCnt, schedule) => specCnt + schedule.specs.length, 0) === 0) {
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
     * run multiple single remote tests
     * @return {Boolean} true if all specs have been run and all instances have finished
     */
    runSpecs () {
        let config = this.configParser.getConfig()

        /**
         * stop spawning new processes when CTRL+C was triggered
         */
        if (this.hasTriggeredExitRoutine) {
            return true
        }

        while (this.getNumberOfRunningInstances() < config.maxInstances) {

            // Re-calculate the schedule caps every time. This array is really important because it
            // this loop executes all tests. The test execution will stop once the scheduleCaps array is zero.
            let schedulableCaps = this.schedule
                /**
                 * bail if number of errors exceeds allowed
                 */
                .filter(() => {
                    const filter = typeof config.bail !== 'number' || config.bail < 1 ||
                                   config.bail > this.runnerFailed

                    /**
                     * clear number of specs when filter is false
                     */
                    if (!filter) {
                        this.schedule.forEach((t) => { t.specs = [] })
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
                .sort((a, b) => a.runningInstances > b.runningInstances)

            /**
             * continue if no capability were schedulable, otherwise exit loop.
             */
            if (schedulableCaps.length === 0) {
                break
            }

            // Remove the first test from the schedule, pass the capability object,
            // capability id, selenium server info and spec files to startInstance.
            // startInstance is the method that kicks off the test.
            //
            // Spawn worker.
            let specs = schedulableCaps[0].specs.shift()
            this.startInstance(
                specs.files,
                schedulableCaps[0].caps,
                schedulableCaps[0].cid,
                schedulableCaps[0].seleniumServer,
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
    // Add the value of runningInstances from each capability in the schedule, return the sum.
    getNumberOfRunningInstances () {
        return this.schedule.map((a) => a.runningInstances).reduce((a, b) => a + b)
    }

    /**
     * get number of total specs left to complete whole suites
     * @return {number} specs left to complete suite
     */
    // Get the length of the specs array for each capability in the schedule.
    // Return the sum.
    getNumberOfSpecsLeft () {
        return this.schedule.map((a) => a.specs.length).reduce((a, b) => a + b)
    }

    /**
     * Start instance in a child process.
     * @param  {Array} specs  Specs to run
     * @param  {Number} cid  Capabilities ID
     * @param  {String} rid  Runner ID override
     * @param  {Number} retries  Number of retries remaining
     */
    startInstance (specs, caps, cid, server, rid, retries) {
        let config = this.configParser.getConfig()
        // Retried tests receive the cid of the failing test as rid
        // so they can run with the same cid of the failing test.
        cid = rid || this.getRunnerId(cid)
        let processNumber = this.runnerStarted + 1

        // process.debugPort defaults to 5858 and is set even when process
        // is not being debugged.
        let debugArgs = []
        let debugType
        let debugHost = ''
        let debugPort = process.debugPort
        for (let i in process.execArgv) {
            const debugArgs = process.execArgv[i].match('--(debug|inspect)(?:-brk)?(?:=(.*):)?')
            if (debugArgs) {
                let [, type, host] = debugArgs
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
        let capExecArgs = [
            ...(config.execArgv || []),
            ...(caps.execArgv || [])
        ]

        // The default value for child.fork execArgs is process.execArgs,
        // so continue to use this unless another value is specified in config.
        let defaultArgs = (capExecArgs.length) ? process.execArgv : []

        // If an arg appears multiple times the last occurrence is used
        let execArgv = [...defaultArgs, ...debugArgs, ...capExecArgs]

        // prefer launcher settings in capabilities over general launcher
        const worker = this.runner.run({
            cid,
            command: 'run',
            configFile: this.configFilePath,
            argv: this.argv,
            caps,
            specs,
            server,
            execArgv,
            retries
        })
        worker.on('message', ::this.interface.onMessage)
        worker.on('error', ::this.interface.onMessage)
        worker.on('exit', ::this.endHandler)

        this.runnerStarted++
    }

    /**
     * generates a runner id
     * @param  {Number} cid capability id (unique identifier for a capability)
     * @return {String}     runner id (combination of cid and test id e.g. 0a, 0b, 1a, 1b ...)
     */
    getRunnerId (cid) {
        if (!this.rid[cid]) {
            this.rid[cid] = 0
        }
        return `${cid}-${this.rid[cid]++}`
    }

    /**
     * Close test runner process once all child processes have exited
     * @param  {Number} cid       Capabilities ID
     * @param  {Number} exitCode  exit code of child process
     * @param  {Array} specs      Specs that were run
     * @param  {Number} retries   Number or retries remaining
     */
    endHandler ({ cid, exitCode, specs, retries }) {
        const passed = this.isWatchModeHalted() || exitCode === 0

        if (!passed && retries > 0) {
            this.schedule[parseInt(cid)].specs.push({ files: specs, retries: retries - 1, rid: cid })
        } else {
            this.exitCode = this.isWatchModeHalted() ? 0 : this.exitCode || exitCode
            this.runnerFailed += !passed ? 1 : 0
        }

        /**
         * avoid emitting job:end if watch mode has been stopped by user
         */
        if (!this.isWatchModeHalted()) {
            this.interface.emit('job:end', { cid, passed, retries })
        }

        /**
         * Update schedule now this process has ended
         */
        // get cid (capability id) from rid (runner id)
        cid = parseInt(cid, 10)

        this.schedule[cid].availableInstances++
        this.schedule[cid].runningInstances--

        /**
         * do nothing if
         * - there are specs to be executed
         * - we are running watch mode
         */
        const shouldRunSpecs = this.runSpecs()
        if (!shouldRunSpecs || (this.isWatchMode && !this.hasTriggeredExitRoutine)) {
            return
        }

        this.resolve(passed ? this.exitCode : 1)
    }

    /**
     * We need exitHandler to catch SIGINT / SIGTERM events.
     * Make sure all started selenium sessions get closed properly and prevent
     * having dead driver processes. To do so let the runner end its Selenium
     * session first before killing
     */
    exitHandler (callback) {
        if (!callback) {
            return
        }

        if (this.hasTriggeredExitRoutine) {
            return callback()
        }

        this.hasTriggeredExitRoutine = true
        this.interface.sigintTrigger()
        return this.runner.shutdown().then(callback)
    }

    /**
     * returns true if user stopped watch mode, ex with ctrl+c
     * @returns {boolean}
     */
    isWatchModeHalted () {
        return this.isWatchMode && this.hasTriggeredExitRoutine
    }
}

export default Launcher
