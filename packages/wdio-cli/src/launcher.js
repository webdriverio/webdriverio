import path from 'path'
import exitHook from 'async-exit-hook'

import logger from '@wdio/logger'
import { ConfigParser, initialisePlugin } from '@wdio/config'

import CLInterface from './interface'
import { getLauncher, runServiceHook } from './utils'

const log = logger('wdio-cli:Launcher')

class Launcher {
    constructor (configFile, argv) {
        this.argv = argv
        this.configFile = configFile

        this.configParser = new ConfigParser()
        this.configParser.addConfigFile(configFile)
        this.configParser.merge(argv)

        const config = this.configParser.getConfig()
        const capabilities = this.configParser.getCapabilities()
        const specs = this.configParser.getSpecs()

        if (config.logDir) {
            process.env.WDIO_LOG_PATH = path.join(config.logDir, `wdio.log`)
        }

        const totalWorkerCnt = Array.isArray(capabilities)
            ? capabilities
                .map((c) => this.configParser.getSpecs(c.specs, c.exclude).length)
                .reduce((a, b) => a + b, 0)
            : 1

        this.interface = new CLInterface(config, specs, totalWorkerCnt)
        config.runnerEnv.FORCE_COLOR = Number(this.interface.hasAnsiSupport)

        const Runner = initialisePlugin(config.runner, 'runner')
        this.runner = new Runner(configFile, config)

        this.isMultiremote = !Array.isArray(capabilities)
        this.exitCode = 0
        this.hasTriggeredExitRoutine = false
        this.hasStartedAnyProcess = false
        this.schedule = []
        this.rid = []
        this.runnerStarted = 0
        this.runnerFailed = 0
    }

    /**
     * run sequence
     * @return  {Promise} that only gets resolves with either an exitCode or an error
     */
    async run () {
        let config = this.configParser.getConfig()
        let caps = this.configParser.getCapabilities()
        const launcher = getLauncher(config)

        /**
         * run pre test tasks for runner plugins
         * (e.g. deploy Lambda functio to AWS)
         */
        await this.runner.initialise()

        /**
         * run onPrepare hook
         */
        await config.onPrepare(config, caps)
        log.info('Run onPrepare hook')
        await runServiceHook(launcher, 'onPrepare', config, caps)

        /**
         * catches ctrl+c event
         */
        exitHook(::this.exitHandler)

        /**
         * make sure the program will not close instantly
         */
        if (process.stdin.isPaused()) {
            process.stdin.resume()
        }

        const exitCode = await this.runMode(config, caps)

        /**
         * run onComplete hook
         */
        log.info('Run onComplete hook')
        await runServiceHook(launcher, 'onComplete', exitCode, config, caps)
        await config.onComplete(exitCode, config, caps, this.interface.result)

        this.interface.updateView()
        return exitCode
    }

    /**
     * run without triggering onPrepare/onComplete hooks
     */
    runMode (config, caps) {
        /**
         * if it is an object run multiremote test
         */
        if (this.isMultiremote) {
            return new Promise((resolve) => {
                this.resolve = resolve
                this.startInstance(this.configParser.getSpecs(), caps, 0)
            })
        }

        /**
         * schedule test runs
         */
        let cid = 0
        for (let capabilities of caps) {
            this.schedule.push({
                cid: cid++,
                caps: capabilities,
                specs: this.configParser.getSpecs(capabilities.specs, capabilities.exclude),
                availableInstances: capabilities.maxInstances || config.maxInstancesPerCapability,
                runningInstances: 0,
                seleniumServer: { hostname: config.hostname, port: config.port, protocol: config.protocol }
            })
        }

        return new Promise((resolve) => {
            this.resolve = resolve

            /**
             * fail if no specs were found or specified
             */
            if (Object.values(this.schedule).reduce((specCnt, schedule) => specCnt + schedule.specs.length, 0) === 0) {
                log.error('No specs found to run, exiting with failure')
                this.interface.updateView()
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
             * continue if no capability were schedulable
             */
            if (schedulableCaps.length === 0) {
                break
            }

            this.startInstance(
                [schedulableCaps[0].specs.shift()],
                schedulableCaps[0].caps,
                schedulableCaps[0].cid,
                schedulableCaps[0].seleniumServer
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
    getNumberOfRunningInstances () {
        return this.schedule.map((a) => a.runningInstances).reduce((a, b) => a + b)
    }

    /**
     * get number of total specs left to complete whole suites
     * @return {number} specs left to complete suite
     */
    getNumberOfSpecsLeft () {
        return this.schedule.map((a) => a.specs.length).reduce((a, b) => a + b)
    }

    /**
     * Start instance in a child process.
     * @param  {Array} specs  Specs to run
     * @param  {Number} cid  Capabilities ID
     */
    startInstance (specs, caps, cid, server) {
        let config = this.configParser.getConfig()
        cid = this.getRunnerId(cid)
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
        let execArgv = [ ...defaultArgs, ...debugArgs, ...capExecArgs ]

        // prefer launcher settings in capabilities over general launcher
        const worker = this.runner.run({
            cid,
            command: 'run',
            configFile: this.configFile,
            argv: this.argv,
            caps,
            specs,
            server,
            execArgv
        })
        worker.on('message', ::this.interface.onMessage)
        worker.on('error', ::this.interface.onMessage)
        worker.on('exit', ::this.endHandler)

        this.interface.emit('job:start', { cid, caps, specs })
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
     */
    endHandler ({ cid, exitCode }) {
        const passed = exitCode === 0
        this.exitCode = this.exitCode || exitCode
        this.runnerFailed += !passed ? 1 : 0
        this.interface.emit('job:end', { cid, passed })

        // Update schedule now this process has ended
        if (!this.isMultiremote) {
            // get cid (capability id) from rid (runner id)
            cid = parseInt(cid, 10)

            this.schedule[cid].availableInstances++
            this.schedule[cid].runningInstances--
        }

        if (!this.isMultiremote && !this.runSpecs()) {
            return
        }

        if (passed) {
            return process.nextTick(() => {
                this.interface.updateView()
                setTimeout(() => this.resolve(this.exitCode), 100)
            })
        }

        /**
         * finish with exit code 1
         */
        return process.nextTick(() => {
            this.interface.updateView()
            setTimeout(() => this.resolve(1), 100)
        })
    }

    /**
     * Make sure all started selenium sessions get closed properly and prevent
     * having dead driver processes. To do so let the runner end its Selenium
     * session first before killing
     */
    exitHandler (callback) {
        this.hasTriggeredExitRoutine = true
        this.interface.sigintTrigger()
        return this.runner.shutdown().then(callback)
    }
}

export default Launcher
