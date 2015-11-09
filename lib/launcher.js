import child from 'child_process'
import DotReporter from 'wdio-dot-reporter'

import ConfigParser from './utils/ConfigParser'
import BaseReporter from './utils/BaseReporter'


class Launcher {
    constructor (configFile, argv) {
        this.configParser = new ConfigParser()
        this.configParser.addConfigFile(configFile)
        this.configParser.merge(argv)

        this.reporter = this.initReporter()

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
     * initialise reporter
     */
    initReporter () {
        let reporter = new BaseReporter()
        let config = this.configParser.getConfig()

        /**
         * if no reporter is set or config property is in a wrong format
         * just use the dot reporter
         */
        if (!config.reporter || !Array.isArray(config.reporter)) {
            reporter.add(new DotReporter(reporter))
            return reporter
        }

        for (let reporter of config.reporter) {
            try {
                let Reporter = require(`wdio-${reporter}-reporter`)
                reporter.add(new Reporter(reporter))
            } catch (e) {
                throw new Error(`reporter "wdio-${reporter}-reporter" is not installed`)
            }
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

        this.reporter.emit('start')
        try {
            await config.onPrepare(config, caps)
        } catch (e) {
            return e
        }

        /**
         * if it is an object run multiremote test
         */
        if (this.isMultiremote()) {
            return this.startInstance(this.configParser.getSpecs(), caps, config)
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
            this.runSpecs(config)
        })

        try {
            await config.onComplete(exitCode)
        } catch (e) {
            return e
        }
        return exitCode
    }

    /**
     * run multiple single remote tests
     */
    runSpecs (config) {
        let specsLeft = 0
        let isRunning = false

        this.schedule.forEach((capability, cid) => {
            let specFiles = capability.specs.length
            specsLeft += specFiles

            for (let i = 0; i < capability.availableInstances && i < specFiles; i++) {
                this.startInstance([capability.specs.pop()], cid, config)
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
    startInstance (specs, i, config) {

        let childProcess = child.fork(__dirname + '/runner.js', [], {
            cwd: process.cwd()
        })

        this.processes.push(childProcess)

        childProcess
            .on('message', this.messageHandler.bind(this))
            .on('exit', this.endHandler.bind(this, config))

        childProcess.send({
            cid: i,
            command: 'run',
            configFile: this.configFile,
            config: config,
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
            this.reporter.emit('error', m)
        }

        this.reporter.emit(m.event, m)
    }

    /**
     * Closes test runner process once all instances finished and excited process.
     * @param  {Number} childProcessExitCode  exit code of child process
     */
    endHandler (config, childProcessExitCode) {
        this.exitCode = this.exitCode || childProcessExitCode

        if (!this.isMultiremote() && !this.runSpecs(config)) {
            return
        }

        this.reporter.emit('end', {
            sigint: this.hasTriggeredExitRoutine,
            exitCode: this.exitCode
        })

        this.resolve(this.exitCode)
    }

    /**
     * Make sure all started selenium sessions get closed properly and prevent
     * having dead driver processes. To do so let the runner end its Selenium
     * session first before killing
     */
    exitHandler () {
        if (this.hasTriggeredExitRoutine || !this.hasStartedAnyProcess) {
            console.log('\nKilling process, bye!')
            return this.resolve(1)
        }

        console.log(`

End selenium sessions properly ...
(press crtl+c again to hard kill the runner)
`)

        this.hasTriggeredExitRoutine = true
    }
}

export default Launcher
