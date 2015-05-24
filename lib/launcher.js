'use strict';

var ConfigParser = require('./utils/ConfigParser'),
    child = require('child_process');

var init = function(configFile, argv) {

    var configParser = new ConfigParser();
    configParser.addConfigFile(configFile);

    var caps = configParser.getCapabilities(),
        config = configParser.getConfig(),
        processes = [],
        Reporter = require('./reporter/' + config.reporter),
        reporter = new Reporter(config),
        executedRunner = 0;

    reporter.emit('start');
    caps.forEach(function(capabilities) {

        var childProcess = child.fork(__dirname + '/runner.js', argv._, {
            cwd: process.cwd(),
            execArgv: ['--harmony']
        });
        processes.push(childProcess);

        childProcess
            .on('message', messageHandler)
            .on('error', endHandler)
            .on('exit', endHandler);

        childProcess.send({
            command: 'run',
            configFile: configFile,
            specs: configParser.getSpecs(),
            capabilities: capabilities
        });

    });

    function messageHandler(m) {
        reporter.emit(m.event, m);
    }

    function endHandler() {
        executedRunner++;

        if(executedRunner === caps.length) {
            reporter.emit('end');
        }
    }

};

module.exports.init = init;