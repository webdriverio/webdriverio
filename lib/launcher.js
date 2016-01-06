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
                throw new Error(`reporter option must be either an array of strings or functions, but got: ${reporterName}`)
            }
        }

        for (let reporterName in reporters) {
            const Reporter = reporters[reporterName]
            const reporterOptions = {}
            for (let option of Object.keys(config.reporterOptions)) {
                if (option === reporterName && typeof config.reporterOptions[reporterName] === 'object') {
                    // Copy over options specifically for this reporter type
                    for (let reporterOption of Object.keys(config.reporterOptions[reporterName])) {
                        reporterOptions[reporterOption] = config.reporterOptions[reporterName][reporterOption]
                    }
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
            return this.startInstance(this.configParser.getSpecs(), caps)
        }

        /**
         * schedule test runs
         */
        for (let capabilities of caps) {
            this.schedule.push({
                specs: this.configParser.getSpecs(capabilities.specs, capabilities.exclude),
                availableInstances: capabilities.maxInstances || config.maxInstances || 1,
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

        let exitCode = await new Promise((resolve, reject) => {
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
                if (typeof service.onPrepare === 'function') {
                    return service.onPrepare.apply(service, args)
                }
            }))
        } catch (e) {
            console.error(`A service failed in the '${hookName}' hook\n${e.stack}\n\nContinue...`)
        }
    }

    /**
     * run multiple single remote tests
     */
    runSpecs () {
        let specsLeft = 0
        let isRunning = false

        this.schedule.forEach((capability, cid) => {
            let specFiles = capability.specs.length
            specsLeft += specFiles

            for (let i = 0; capability.availableInstances > 0 && i < specFiles; i++) {
                this.startInstance([capability.specs.pop()], cid)
                capability.availableInstances--
                capability.runningInstances++
            }
            isRunning = isRunning || capability.runningInstances > 0
        })

        return specsLeft === 0 && !isRunning
    }

    /**
     * Start instance in a child process.
     * @param  {Object|Object[]} capabilities  desired capabilities of instance
     */
    startInstance (specs, i) {
        let childProcess = child.fork(__dirname + '/runner.js', [], {
            cwd: process.cwd()
        })

        this.processes.push(childProcess)

        childProcess
            .on('message', this.messageHandler.bind(this))
            .on('exit', this.endHandler.bind(this))

        childProcess.send({
            cid: i,
            command: 'run',
            configFile: this.configFile,
            argv: this.argv,
            specs: specs,
            isMultiremote: this.isMultiremote()
        })
    }

    /**
     * emit event from child process to reporter
     * @param  {Object} m  event object
     */
    messageHandler (m) {
        this.hasStartedAnyProcess = true

        /**
         * update schedule
         */
        if (m.event === 'runner:end' || m.event === 'runner:error') {
            this.schedule[m.cid].availableInstances++
            this.schedule[m.cid].runningInstances--
        }

        if (m.event === 'runner:error') {
            this.reporters.handleEvent('error', m)
        }

        this.reporters.handleEvent(m.event, m)
    }

    /**
     * Closes test runner process once all instances finished and excited process.
     * @param  {Number} childProcessExitCode  exit code of child process
     */
    endHandler (childProcessExitCode) {
        this.exitCode = this.exitCode || childProcessExitCode

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
