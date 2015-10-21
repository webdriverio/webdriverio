import child from 'child_process'
import DotReporter from 'wdio-dot-reporter'

import ConfigParser from './utils/ConfigParser'
import BaseReporter from './utils/BaseReporter'

let launcher = {}

launcher.init = function (configFile, argv) {
    let configParser = new ConfigParser()
    configParser.addConfigFile(configFile)
    configParser.merge(argv)

    let caps = configParser.getCapabilities()
    let config = configParser.getConfig()
    let isMultiremote = !Array.isArray(caps)
    let exitCode = 0
    let hasTriggeredExitRoutine = false
    let processes = []
    let schedule = []

    /**
     * check for custom reporter
     * ToDo: allow reporter passed as an array
     */
    let reporter = new BaseReporter()
    if (config.reporter && Array.isArray(config.reporter)) {
        for (let Reporter of config.reporter) {
            reporter.add(new Reporter(reporter))
        }
    } else {
        reporter.add(new DotReporter(reporter))
    }
    reporter.emit('start')

    Promise.resolve(config.onPrepare(config)).then(() => {
        /**
         * if it is an object run multiremote test
         */
        if (isMultiremote) {
            return startInstance(configParser.getSpecs(), caps)
        }

        for (let capabilities of caps) {
            schedule.push({
                specs: configParser.getSpecs(capabilities.specs, capabilities.exclude),
                availableInstances: capabilities.maxInstances || config.maxInstances || 1,
                runningInstances: 0
            })
        }

        runSpecs()
    })

    /**
     * catches ctrl+c event
     */
    process.on('SIGINT', exitHandler)

    /**
     * make sure the program will not close instantly
     */
    process.stdin.resume()

    /**
     * run multiple single remote tests
     */
    function runSpecs () {
        let specsLeft = 0
        let isRunning = false

        schedule.forEach((capability, cid) => {
            let specFiles = capability.specs.length
            specsLeft += specFiles

            for (let i = 0; i < capability.availableInstances && i < specFiles; i++) {
                startInstance([capability.specs.pop()], cid)
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
    function startInstance (specs, i) {
        let childProcess = child.fork(__dirname + '/runner.js', [], {
            cwd: process.cwd()
        })

        processes.push(childProcess)

        childProcess
            .on('message', messageHandler)
            .on('exit', endHandler)

        childProcess.send({
            cid: i,
            command: 'run',
            configFile: configFile,
            argv: argv,
            specs: specs,
            isMultiremote: isMultiremote
        })
    }

    /**
     * emit event from child process to reporter
     * @param  {Object} m  event object
     */
    function messageHandler (m) {
        if (m.event === 'runner:end') {
            schedule[m.cid].availableInstances++
            schedule[m.cid].runningInstances--
        }

        reporter.emit(m.event, m)
    }

    /**
     * Closes test runner process once all instances finished and excited process.
     * @param  {Number} childProcessExitCode  exit code of child process
     */
    function endHandler (childProcessExitCode) {
        exitCode = exitCode || childProcessExitCode
        if (!isMultiremote && !runSpecs()) {
            return
        }

        config.onComplete()
        reporter.emit('end', {
            sigint: hasTriggeredExitRoutine
        })

        if (!reporter.fileStream) {
            return process.exit(exitCode)
        }

        /**
         * give reporter enough time to write everything into log file
         */
        setTimeout(() => process.exit(exitCode), 100)
    }

    /**
     * Make sure all started selenium sessions get closed properly and prevent
     * having dead driver processes. To do so let the runner end its Selenium
     * session first before killing
     */
    function exitHandler () {
        if (hasTriggeredExitRoutine) {
            console.log('\nKilling process, bye!')
            return process.exit(1)
        }

        console.log(`

End selenium sessions properly ...
(press crtl+c again to hard kill the runner)
`)

        hasTriggeredExitRoutine = true
    }
}

export default launcher
