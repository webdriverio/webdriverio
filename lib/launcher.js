'use strict';

var ConfigParser = require('./utils/ConfigParser'),
    child = require('child_process'),
    q = require('q');

var init = function(configFile, argv) {

    var configParser = new ConfigParser();
    configParser.addConfigFile(configFile);
    configParser.merge(argv);

    var caps = configParser.getCapabilities(),
        config = configParser.getConfig(),
        processes = [],
        isMultiremote = !Array.isArray(caps),
        exitCode = 0,
        hasTriggeredExitRoutine = false,
        Reporter,
        schedule = [];

    /**
     * check for custom reporter
     */
    if(typeof config.reporter === 'function') {
        Reporter = config.reporter;
    } else {
        Reporter = require('./reporter/' + config.reporter);
    }

    var reporter = new Reporter(config);
    reporter.emit('start');

    q(config.onPrepare(config)).then(function() {
        /**
         * if it is an object run multiremote test
         */
        if(isMultiremote) {
            return startInstance(configParser.getSpecs(), caps);
        }

        caps.forEach(function(capabilities) {
            schedule.push({
                specs: configParser.getSpecs(capabilities.specs, capabilities.exclude),
                availableInstances: capabilities.maxInstances || config.maxInstances || 1,
                runningInstances: 0
            });
        });

        runSpecs();
    });

    /**
     * catches ctrl+c event
     */
    process.on('SIGINT', exitHandler);

    /**
     * make sure the program will not close instantly
     */
    process.stdin.resume();

    /**
     * run multiple single remote tests
     */
    function runSpecs() {
        var specsLeft = 0,
            isRunning = false;

        schedule.forEach(function(capability, cid) {
            var specFiles = capability.specs.length;
            specsLeft += specFiles;

            for(var i = 0; i < capability.availableInstances && i < specFiles; i++) {
                startInstance([capability.specs.pop()], cid);
                schedule[cid].availableInstances--;
                schedule[cid].runningInstances++;
            }
            isRunning = isRunning || schedule[cid].runningInstances > 0;
        });

        return specsLeft === 0 && !isRunning;
    }

    /**
     * Start instance in a child process.
     * @param  {Object|Object[]} capabilities  desired capabilities of instance
     */
    function startInstance(specs, i) {
        var childProcess = child.fork(__dirname + '/runner.js', [], {
            cwd: process.cwd(),
            execArgv: ['--harmony']
        });

        processes.push(childProcess);

        childProcess
            .on('message', messageHandler)
            .on('exit', endHandler);

        childProcess.send({
            cid: i,
            command: 'run',
            configFile: configFile,
            argv: argv,
            specs: specs,
            isMultiremote: isMultiremote
        });
    }

    /**
     * emit event from child process to reporter
     * @param  {Object} m  event object
     */
    function messageHandler(m) {
        if(m.event === 'runner:end') {
            schedule[m.cid].availableInstances++;
            schedule[m.cid].runningInstances--;
        }

        reporter.emit(m.event, m);
    }

    /**
     * Closes test runner process once all instances finished and excited process.
     * @param  {Number} childProcessExitCode  exit code of child process
     */
    function endHandler(childProcessExitCode) {

        exitCode = exitCode || childProcessExitCode;
        if(!isMultiremote && !runSpecs()) {
            return;
        }

        config.onComplete();
        reporter.emit('end', {
            sigint: hasTriggeredExitRoutine
        });

        if(!reporter.fileStream) {
            return process.exit(exitCode);
        }

        /**
         * give reporter enough time to write everything into log file
         */
        setTimeout(function() {
            process.exit(exitCode);
        }, 100);
    }

    /**
     * Make sure all started selenium sessions get closed properly and prevent
     * having dead driver processes. To do so let the runner end its Selenium
     * session first before killing
     */
    function exitHandler() {
        if(hasTriggeredExitRoutine) {
            console.log('\nKilling process, bye!');
            return process.exit(1);
        }

        console.log('\n\nEnd selenium sessions properly ...');
        console.log('(press crtl+c again to hard kill the runner)\n');

        hasTriggeredExitRoutine = true;
    }

};

module.exports.init = init;