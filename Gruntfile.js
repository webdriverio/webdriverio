'use strict';
var merge = require('deepmerge'),
    selenium = {
        base: 'https://selenium-release.storage.googleapis.com',
        version: '2.46.0',
        get minorVersion () {
            return this.version.split('.').slice(0, 2).join('.');
        },
        get filename() {
            return 'selenium-server-standalone-' + this.version + '.jar';
        },
        get url () {
            return [this.base, this.minorVersion, this.filename].join('/');
        }
    },
    gruntOptions = {
        env: '_ENV',
        browser: '_BROWSER',
        spec: '_SPEC'
    };

module.exports = function (grunt) {

    function addEnv(envs) {
        grunt.config.merge({
            env: {
                env : {
                    add: envs
                }
            }
        });
    }

    require('load-grunt-tasks')(grunt);
    require('./test/tasks/grunt-appium')(grunt);

    // TODO move this to a separate grunt task
    (function gruntOptionsToEnvVars() {
        var option, value, envName;
        for (option in gruntOptions) {
            value = grunt.option(option);
            if (value) {
                envName = gruntOptions[option];
                process.env[envName] = value;
            }
        }
    }());

    if (grunt.option('selenium')) {
        selenium.version = grunt.option('selenium');
    }

    grunt.config('env', {
        env: {
            add: {
                _MOCHATIMEOUT: 5 * 1000
            },
            unshift: {
                PATH: 'node_modules/.bin/:'
            }
        }
    });

    grunt.registerTask('config', function() {
        grunt.initConfig({
            'connect': {
                server: {
                    options: {
                        hostname: '127.0.0.1',
                        port: 8080,
                        base: 'test/site/www'
                    }
                }
            },
            'start-selenium-server': {
                dev: {
                    options: {
                        autostop: true,
                        downloadUrl: selenium.url,
                        serverOptions: {
                            browser: process.env._BROWSER
                        }
                    }
                }
            },
            'stop-selenium-server': {
                dev: {}
            },
            'appium': {},
            'mochaTest': {
                options: {
                    force: true
                },
                test: {
                    src: (function (){
                        var env, src, includeSpec;
                        if (process.env._SPEC) {
                            return [process.env._SPEC];
                        }
                        env = process.env._ENV;
                        src = ['test/spec/' + env + '/**/*.js'];
                        includeSpec = env.match(/^(mobile|desktop)$/);
                        if (includeSpec) {
                            src.push('test/spec/*.js');
                        }
                        return src;
                    }()),
                    options: {
                        reporter: 'spec',
                        require: 'test/setup.js',
                        timeout: process.env._MOCHATIMEOUT
                    }
                }
            },
            'passfail': {
                options: {
                    force: true
                },
                'mochaTest': {
                    success: function() {
                        require('./test/helper').success(this.async());
                    },
                    fail: function (warncount, errorcount) {
                        require('./test/helper').failure(this.async());
                    }
                }
            }
        });
    });

    grunt.registerTask('run-test', function() {
        grunt.task.run('env', 'config', 'connect', 'start-selenium-server', 'mochaTest', 'passfail');
    });

    grunt.registerTask('test', function () {
        if (process.env._ENV === undefined) {
            throw new Error('_ENV environment variable must be defined');
        }
        grunt.task.run('test-' + process.env._ENV.toLowerCase());
    });

    grunt.registerTask('test-functional', function () {
        addEnv({
            _ENV: 'functional',
            _BROWSER: 'phantomjs'
        });
        grunt.task.run('run-test');
    });

    grunt.registerTask('test-desktop', function () {
        addEnv({
            _ENV: 'desktop',
            _BROWSER: 'chrome'
        });
        grunt.task.run('run-test');
    });

    grunt.registerTask('test-multibrowser', function () {
        addEnv({
            _ENV: 'multibrowser'
        });
        grunt.task.run('run-test');
    });

    grunt.registerTask('test-mobile', function () {
        addEnv({
            _ENV: 'mobile',
            _BROWSER: 'safari',
            _DEVICENAME: 'iPhone 6 Plus',
            _PLATFORMNAME: 'iOS',
            _PLATFORMVERSION: 8.4,
            _APP: 'safari',
            _PORT: 4723,
            _APPIUMVERSION: '1.3.4',
            _MOCHATIMEOUT: 30 * 1000
        });
        grunt.task.run('env', 'config', 'connect', 'appium', 'mochaTest', 'passfail');
    });
}