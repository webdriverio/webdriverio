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
        executedRunner = 0;

    reporter.emit('start');
    q(config.onPrepare(config)).then(function() {

        caps.forEach(function(capabilities) {

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
                specs: configParser.getSpecs(),
                capabilities: capabilities
            });

        });

    });

    function messageHandler(m) {
        reporter.emit(m.event, m);
    }

    function endHandler(exitCode) {
        executedRunner++;

        if(executedRunner !== caps.length) {
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