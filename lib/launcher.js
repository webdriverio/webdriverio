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
        Reporter = require('./reporter/' + config.reporter),
        reporter = new Reporter(config),
        isMultiremote = !Array.isArray(caps),
        executedRunner = 0,
        exitCode = 0,
        hasTriggeredExitRoutine = false;

    reporter.emit('start');
    q(config.onPrepare(config)).then(function() {
        /**
         * if it is an object run multiremote test
         */
        if(isMultiremote) {
            return startInstance(caps);
        }

        /**
         * run multiple single remote tests
         */
        return caps.forEach(startInstance);
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
     * Start instance in a child process.
     * @param  {Object|Object[]} capabilities  desired capabilities of instance
     */
    function startInstance(capabilities) {
        var childProcess = child.fork(__dirname + '/runner.js', [], {
            cwd: process.cwd(),
            execArgv: ['--harmony']
        });

        processes.push(childProcess);

        childProcess
            .on('message', messageHandler)
            .on('exit', endHandler);

        childProcess.send({
            command: 'run',
            configFile: configFile,
            argv: argv,
            specs: configParser.getSpecs(capabilities.specs, capabilities.exclude),
            capabilities: capabilities,
            isMultiremote: isMultiremote
        });
    }

    /**
     * emit event from child process to reporter
     * @param  {Object} m  event object
     */
    function messageHandler(m) {
        reporter.emit(m.event, m);
    }

    /**
     * Closes test runner process once all instances finished and excited process.
     * @param  {Number} childProcessExitCode  exit code of child process
     */
    function endHandler(childProcessExitCode) {
        executedRunner++;

        exitCode = exitCode || childProcessExitCode;
        if(!isMultiremote && executedRunner !== caps.length) {
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