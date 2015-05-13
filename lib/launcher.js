'use strict';

var ConfigParser = require('./utils/ConfigParser'),
    child = require('child_process');

var init = function(configFile, argv) {

    var configParser = new ConfigParser();
    configParser.addConfigFile(configFile);

    var caps = configParser.getCapabilities(),
        processes = [];

    caps.forEach(function() {
        var childProcess = child.fork(__dirname + '/runner.js', argv, {
            cwd: process.cwd(),
            silent: true
        });
        processes.push(childProcess);

        // stdout pipe
        childProcess.stdout.on('data', function(data) {
          console.log(data); // Todo
        });

        // stderr pipe
        childProcess.stderr.on('data', function(data) {
          console.log(data); // Todo
        });

        childProcess.on('message', function(m) {

            switch(m.event) {
                case 'start':
                    console.log('start');
                    break;
                case 'end':
                    console.log('end');
                    break;
                case 'suite:start':
                    console.log('suite start');
                    break;
                case 'suite:end':
                    console.log('suite end');
                    break;
                case 'test:start':
                    console.log('test start');
                    break;
                case 'test:end':
                    console.log('test end');
                    break;
                case 'hook:start':
                    console.log('hook start');
                    break;
                case 'hook:end':
                    console.log('hook end');
                    break;
                case 'test:pass':
                    console.log('test pass');
                    break;
                case 'test:fail':
                    console.log('test fail');
                    break;
                case 'test:pending':
                    console.log('test pending');
                    break;
                default: console.log('can\’t recognise event', m.event);
            }

        }).on('error', function() {
            console.log('runner error');
        }).on('exit', function() {
            console.log('runner exit');
        });

        childProcess.send({
            command: 'run',
            configFile: configFile,
            specs: configParser.getSpecs(),
            capabilities: configParser.getCapabilities()
        });

    });

};

module.exports.init = init;