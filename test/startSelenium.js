/**
 * startSelenium
 * https://github.com/Camme/webdriverjs
 *
 * Copyright (c) 2013 Christian Bromann
 * Licensed under the MIT license.
 *
 * checks if a selenium process is running
 * if not start standalone server automatically
 * @param  {Function} callback executes if selenium server is running
 * @param  {Function} done     executes grunt task
 * @param  {Object}   grunt    grunt object
 * @return null                obsolete
 */

var exec  = require('child_process').exec,
    spawn = require('child_process').spawn,
    fs    = require('fs');

module.exports = function (callback, done, grunt) {
    exec('ps auxw | grep selenium-server-standalone | grep -v grep', [], function(error, stdout, stderr) {
        if(!stdout.length) {
            console.log('\nCouldn\'t find any selenium server process');
            console.log('\nStarting selenium server...');

            var seleniumServer = spawn('java', ['-jar', __dirname+'/../bin/selenium-server-standalone-2.31.0.jar']);

            seleniumServer.stdout.on('data', function (data) {
                if(data.toString().indexOf('Started SocketListener') !== -1) {
                    console.log('\nServer started successfully!');
                    console.log('\nStarting tests now...\n');
                    callback();
                }
            });

        } else {
            callback();
        }
    });
};