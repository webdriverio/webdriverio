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
        exitCode = 0;

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
        reporter.emit('end');

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

};

module.exports.init = init;