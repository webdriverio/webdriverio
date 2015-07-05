'use strict';

var selenium = {
        base: 'https://selenium-release.storage.googleapis.com',
        version: '2.45.0',
        get minorVersion () {
            return this.version.split('.').slice(0, 2).join('.');
        },
        get filename() {
            return 'selenium-server-standalone-' + this.version + '.jar';
        },
        get url () {
            return [this.base, this.minorVersion, this.filename].join('/');
        }
    };

process.env.PATH = 'node_modules/.bin/:' + process.env.PATH;

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);
    require('./test/tasks/appium')(grunt);

    if (grunt.option('selenium')) {
        selenium.version = grunt.option('selenium');
    }

    function setBrowser(browserName) {
        if (grunt.option('browser')) {
            browserName = grunt.option('browser');
        }
        process.env._BROWSER = browserName;
        grunt.config.set('start-selenium-server.dev.options.serverOptions.browser', browserName);
    }

    function setEnv(env) {
        var testSrc = 'mochaTest.test.src',
            specDir = env.match(/^(desktop|functional|mobile|multibrowser)$/);

        process.env._ENV = env;

        if (!grunt.config.get(testSrc)) {
            if (specDir) {
                // only test functional test spec if required
                grunt.config.set(testSrc, ['test/spec/' + specDir[0] + '/**/*.js']);
            } else {
                // otherwise test global + device specific test specs
                grunt.config.set(testSrc, ['test/spec/' + env + '/**/*.js', 'test/spec/*.js']);
            }
        }
    }

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
                        browser: 'chrome'
                    }
                }
            }
        },
        'appium': {
            options: {
                args: []
            }
        },
        'mochaTest': {
            test: {
                src: grunt.option('spec') || process.env._SPEC,
                options: {
                    reporter: 'spec',
                    timeout: 5 * 1000,
                    require: 'test/setup.js'
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

    grunt.registerTask('run-test', ['connect', 'start-selenium-server', 'force:mochaTest', 'passfail']);

    grunt.registerTask('test-functional', function () {
        setEnv('functional');
        setBrowser('phantomjs');
        grunt.task.run('run-test');
    });

    grunt.registerTask('test-desktop', function () {
        setEnv('desktop');
        setBrowser('chrome');
        grunt.task.run('run-test');
    });

    grunt.registerTask('test-multibrowser', function () {
        setEnv('multibrowser');
        grunt.task.run('run-test');
    });

    grunt.registerTask('test-mobile', function () {
        setEnv('mobile');
        setBrowser('safari');
        process.env._DEVICENAME = 'iPhone Simulator';
        process.env._PLATFORMNAME = 'iOS';
        process.env._PLATFORMVERSION = 8.3;
        process.env._APP = 'safari';
        process.env._PORT = 4723;
        // process.env._APPIUMVERSION = 1.2;
        grunt.task.run('connect', 'appium', 'force:mochaTest', 'passfail');
    });
}
