import child from 'child_process'

import ConfigParser from './utils/ConfigParser'
import BaseReporter from './utils/BaseReporter'


class Launcher {
    constructor (configFile, argv) {
        this.configParser = new ConfigParser()
        this.configParser.addConfigFile(configFile)
        this.configParser.merge(argv)

        this.reporters = this.initReporters()

        this.argv = argv
        this.configFile = configFile

        this.exitCode = 0
        this.hasTriggeredExitRoutine = false
        this.hasStartedAnyProcess = false
        this.processes = []
        this.schedule = []
    }

    /**
     * check if multiremote or wdio test
     */
    isMultiremote () {
        let caps = this.configParser.getCapabilities()
        return !Array.isArray(caps)
    }

    /**
     * initialise reporters
     */
    initReporters () {
        let reporter = new BaseReporter()
        let config = this.configParser.getConfig()

        /**
         * if no reporter is set or config property is in a wrong format
         * just use the dot reporter
         */
        if (!config.reporters || !Array.isArray(config.reporters) || !config.reporters.length) {
            config.reporters = ['dot']
        }

        const reporters = {}

        for (let reporterName of config.reporters) {
            let Reporter
            if (typeof reporterName === 'function') {
                Reporter = reporterName
                if (!Reporter.reporterName) {
                    throw new Error(`Custom reporters must export a unique 'reporterName' property`)
                }
                reporters[Reporter.reporterName] = Reporter
            } else if (typeof reporterName === 'string') {
                try {
                    Reporter = require(`wdio-${reporterName}-reporter`)
                } catch (e) {
                    throw new Error(`reporter "wdio-${reporterName}-reporter" is not installed. Error: ${e.stack}`)
                }
                reporters[reporterName] = Reporter
            }
            if (!Reporter) {
                throw new Error(`config.reporters must be an array of strings or functions, but got '${typeof reporterName}': ${reporterName}`)
            }
        }

        /**
         * if no reporter options are set or property is in a wrong format default to
         * empty object
         */
        if (!config.reporterOptions || typeof config.reporterOptions !== 'object') {
            config.reporterOptions = {}
        }

        for (let reporterName in reporters) {
            const Reporter = reporters[reporterName]
            let reporterOptions = {}
            for (let option of Object.keys(config.reporterOptions)) {
                if (option === reporterName && typeof config.reporterOptions[reporterName] === 'object') {
                    // Copy over options specifically for this reporter type
                    reporterOptions = Object.assign(reporterOptions, config.reporterOptions[reporterName])
                } else if (reporters[option]) {
                    // Don't copy options for other reporters
                    continue
                } else {
                    // Copy over generic options
                    reporterOptions[option] = config.reporterOptions[option]
                }
            }

            reporter.add(new Reporter(reporter, config, reporterOptions))
        }

        return reporter
    }

    /**
     * run sequence
     * @return  {Promise} that only gets resolves with either an exitCode or an error
     */
    async run () {
        let config = this.configParser.getConfig()
        let caps = this.configParser.getCapabilities()
        let launcher = this.getLauncher(config)

        this.reporters.handleEvent('start')

        /**
         * run onPrepare hook
         */
        await config.onPrepare(config, caps)
        await this.runServiceHook(launcher, 'onPrepare', config, caps)

        /**
         * if it is an object run multiremote test
         */
        if (this.isMultiremote()) {
            let exitCode = await new Promise((resolve) => {
                this.resolve = resolve
                this.startInstance(this.configParser.getSpecs(), caps, 0)
            })

            return exitCode
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
                runningInstances: 0
            })
        }

        /**
         * catches ctrl+c event
         */
        process.on('SIGINT', this.exitHandler.bind(this))

        /**
         * make sure the program will not close instantly
         */
        process.stdin.resume()

        let exitCode = await new Promise((resolve) => {
            this.resolve = resolve
            this.runSpecs()
        })

        /**
         * run onComplete hook
         */
        await this.runServiceHook(launcher, 'onComplete', exitCode)
        await config.onComplete(exitCode)

        return exitCode
    }

    /**
     * run service launch sequences
     */
    async runServiceHook (launcher, hookName, ...args) {
        try {
            return await Promise.all(launcher.map((service) => {
                if (typeof service[hookName] === 'function') {
                    return service[hookName](...args)
                }
            }))
        } catch (e) {
            console.error(`A service failed in the '${hookName}' hook\n${e.stack}\n\nContinue...`)
        }
    }

    /**
     * run multiple single remote tests
     * @return {Boolean} true if all specs have been run and all instances have finished
     */
    runSpecs () {
        let config = this.configParser.getConfig()

        while (this.getNumberOfRunningInstances() < config.maxInstances) {
            let schedulableCaps = this.schedule
                /**
                 * make sure complete number of running instances is not higher than general maxInstances number
                 */
                .filter((a) => this.getNumberOfRunningInstances() < config.maxInstances)
                /**
                 * make sure the capabiltiy has available capacities
                 */
                .filter((a) => a.availableInstances > 0)
                /**
                 * make sure capabiltiy has still caps to run
                 */
                .filter((a) => a.specs.length > 0)
                /**
                 * make sure we are running caps with less running instances first
                 */
                .sort((a, b) => a.runningInstances > b.runningInstances)

            /**
             * continue if no capabiltiy were schedulable
             */
            if (schedulableCaps.length === 0) {
                break
            }

            this.startInstance([schedulableCaps[0].specs.pop()], schedulableCaps[0].caps, schedulableCaps[0].cid)
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
    startInstance (specs, caps, cid) {
        let config = this.configParser.getConfig()
        let debug = caps.debug || config.debug

        // process.debugPort defaults to 5858 and is set even when process
        // is not being debugged.
        let debugArgs = (debug)
          ? [`--debug=${(process.debugPort + cid + 1)}`]
          : []

        // if you would like to add --debug-brk, use a different port, etc...
        let capExecArgs = [
            ...(config.execArgv || []),
            ...(caps.execArgv || [])
        ]

        // The default value for child.fork execArgs is process.execArgs,
        // so continue to use this unless another value is specified in config.
        let defaultArgs = (capExecArgs.length) ? process.execArgv : []

        // If an arg appears multiple times the last occurence is used
        let execArgv = [ ...defaultArgs, ...debugArgs, ...capExecArgs ]

        let childProcess = child.fork(__dirname + '/runner.js', process.argv.slice(2), {
            cwd: process.cwd(),
            execArgv
        })

        this.processes.push(childProcess)

        childProcess
            .on('message', this.messageHandler.bind(this))
            .on('exit', this.endHandler.bind(this, cid))

        childProcess.send({
            cid,
            command: 'run',
            configFile: this.configFile,
            argv: this.argv,
            caps,
            specs,
            isMultiremote: this.isMultiremote()
        })
    }

    /**
     * emit event from child process to reporter
     * @param  {Object} m  event object
     */
    messageHandler (m) {
        this.hasStartedAnyProcess = true

        if (m.event === 'runner:error') {
            this.reporters.handleEvent('error', m)
        }

        this.reporters.handleEvent(m.event, m)
    }

    /**
     * Close test runner process once all child processes have exited
     * @param  {Number} cid  Capabilities ID
     * @param  {Number} childProcessExitCode  exit code of child process
     */
    endHandler (cid, childProcessExitCode) {
        this.exitCode = this.exitCode || childProcessExitCode

        // Update schedule now this process has ended
        if (!this.isMultiremote()) {
            this.schedule[cid].availableInstances++
            this.schedule[cid].runningInstances--
        }

        if (!this.isMultiremote() && !this.runSpecs()) {
            return
        }

        this.reporters.handleEvent('end', {
            sigint: this.hasTriggeredExitRoutine,
            exitCode: this.exitCode
        })

        if (this.exitCode === 0) {
            return this.resolve(this.exitCode)
        }

        /**
         * finish with exit code 1
         */
        return this.resolve(1)
    }

    /**
     * Make sure all started selenium sessions get closed properly and prevent
     * having dead driver processes. To do so let the runner end its Selenium
     * session first before killing
     */
    exitHandler () {
        if (this.hasTriggeredExitRoutine || !this.hasStartedAnyProcess) {
            console.log('\nKilling process, bye!')

            /**
             * finish with exit code 1
             */
            return this.resolve(1)
        }

        // When spawned as a subprocess,
        // SIGINT will not be forwarded to childs.
        // Thus for the child to exit cleanly, we must force send SIGINT
        if (!process.stdin.isTTY) {
            this.processes.forEach(p => p.kill('SIGINT'))
        }

        console.log(`

End selenium sessions properly ...
(press crtl+c again to hard kill the runner)
`)

        this.hasTriggeredExitRoutine = true
    }

    /**
     * loads launch services
     */
    getLauncher (config) {
        let launchServices = []

        if (!Array.isArray(config.services)) {
            return launchServices
        }

        for (let serviceName of config.services) {
            let service

            /**
             * allow custom services
             */
            if (typeof serviceName === 'object') {
                launchServices.push(serviceName)
                continue
            }

            try {
                service = require(`wdio-${serviceName}-service/launcher`)
            } catch (e) {}

            if (service && (typeof service.onPrepare === 'function' || typeof service.onPrepare === 'function')) {
                launchServices.push(service)
            }
        }

        return launchServices
    }
}

export default Launcher
