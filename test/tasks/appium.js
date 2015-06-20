'use strict';

var spawn = require('child_process').spawn,
    defaultOptions = {
        args: []
    };

module.exports = function (grunt) {
    var appium;
    function kill(err) {
        if (err)
            console.error(err);
        if (appium)
            appium.kill('SIGINT');
    }

    process.on('exit', kill);
    process.on('SIGINT', kill);
    process.on('uncaughtException', kill);

    grunt.registerTask('appium', function (arg) {
        var done,
            options = this.options(defaultOptions);

        if (arg === 'kill')
            return kill();

        done = this.async();
        appium = spawn('appium', options.args);
        appium.stdout.on('data', function (data) {
            var str = data.toString();
            grunt.log.write(str);
            if (str.match(/listener started on/))
                done(true);
        });
        appium.stderr.on('data', function (data) {
            grunt.log.error(data);
        });
        appium.on('error', done);
    });
}
