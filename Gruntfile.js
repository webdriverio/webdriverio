'use strict';

var seleniumVersion = '2.45.0',
    seleniumMinorVersion = seleniumVersion.split('.').slice(0, 2).join('.');

process.env.PATH = 'node_modules/.bin/:' + process.env.PATH;

module.exports = function (grunt) {
    require('load-grunt-tasks')(grunt);

    function setBrowser(browserName) {
        process.env._BROWSER = browserName;
        grunt.config.set('start-selenium-server.dev.options.serverOptions.browser', browserName);
    }

    function setEnv(env) {
        var testSrc = 'mochaTest.test.src',
            specDir = env.match(/^(functional|multibrowser)$/);

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

    //TODO istanbul code coverage
    // "coverage": "./node_modules/.bin/istanbul cover -x \"**/helpers/_*.js\" ./test/runner.js",

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
                    downloadUrl: 'https://selenium-release.storage.googleapis.com/' + seleniumMinorVersion + '/selenium-server-standalone-' + seleniumVersion + '.jar',
                    serverOptions: {
                        browser: 'chrome'
                    }
                }
            }
        },
        'stop-selenium-server': {
            dev: {}
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

    grunt.registerTask('run-test', ['connect', 'start-selenium-server', 'force:mochaTest', 'passfail', 'stop-selenium-server']);

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
        setBrowser('Safari');
        process.env._APP = 'safari';
        process.env._PLATFORMVERSION = 7.1;
        process.env._APPIUMVERSION = 1.2;
        process.env._PLATFORMNAME = 'iOS';
        process.env._DEVICENAME = 'iPhone_Simulator';
        process.env._PORT = 4723;
        grunt.task.run('run-test');
    });

    grunt.registerTask('test-all', ['test-functional', 'test-desktop', 'test-multibrowser', 'test-mobile']);

    grunt.registerTask('default', ['test-desktop']);
}
