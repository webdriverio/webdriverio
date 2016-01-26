module.exports = function (grunt) {
    var argv = require('optimist').argv

    var mochaInstanbulOpts = {
        scriptPath: require.resolve('isparta/bin/isparta'),
        report: ['lcov', 'html'],
        excludes: ['**/scripts/**', '**/gruntfile.js'],
        verbose: true,
        mochaOptions: ['--compilers', 'js:babel/register', '--recursive', '-t', '120000', '--reporter', 'spec']
    }

    var mochaOpts = {
        reporter: 'spec',
        require: ['babel/register'],
        grep: argv.grep,
        invert: argv.invert,
        bail: argv.bail,
        timeout: 120000
    }

    function addEnv (envs) {
        grunt.config.merge({ env: { env: { add: envs } } })
    }

    grunt.initConfig({
        pkgFile: 'package.json',
        clean: ['build'],
        babel: {
            options: {
                optional: ['runtime']
            },
            commands: {
                files: [{
                    expand: true,
                    cwd: './',
                    src: ['lib/commands/*.js'],
                    dest: 'build',
                    ext: '.js'
                }]
            },
            protocol: {
                files: [{
                    expand: true,
                    cwd: './',
                    src: ['lib/protocol/*.js'],
                    dest: 'build',
                    ext: '.js'
                }]
            },
            core: {
                files: [{
                    expand: true,
                    cwd: './',
                    src: [
                        'lib/*.js',
                        'lib/scripts/*.js',
                        'lib/utils/*.js',
                        'lib/helpers/*.js',
                        'index.js'
                    ],
                    dest: 'build',
                    ext: '.js'
                }]
            }
        },
        mocha_istanbul: {
            functional: {
                src: ['./test/setup.js', 'test/spec/functional/**/*.js'],
                options: mochaInstanbulOpts
            },
            multibrowser: {
                src: ['./test/setup.js', 'test/spec/multibrowser/**/*.js'],
                options: mochaInstanbulOpts
            },
            desktop: {
                src: ['./test/setup.js', 'test/spec/*.js', 'test/spec/desktop/*.js'],
                options: mochaInstanbulOpts
            },
            android: {
                src: ['./test/setup.js', 'test/spec/mobile/*.js', 'test/spec/mobile/android/*.js'],
                options: mochaInstanbulOpts
            },
            ios: {
                src: ['./test/setup.js', 'test/spec/mobile/*.js', 'test/spec/mobile/ios/*.js'],
                options: mochaInstanbulOpts
            },
            unit: {
                src: ['./test/setup-unit.js', 'test/spec/unit/*.js'],
                options: mochaInstanbulOpts
            },
            wdio: {
                src: ['./test/setup-unit.js', 'test/spec/wdio/*.js'],
                options: mochaInstanbulOpts
            }
        },
        mochaTest: {
            functional: {
                src: ['./test/setup.js', 'test/spec/functional/**/*.js'],
                options: mochaOpts
            },
            multibrowser: {
                src: ['./test/setup.js', 'test/spec/multibrowser/**/*.js'],
                options: mochaOpts
            },
            desktop: {
                src: ['./test/setup.js', 'test/spec/*.js', 'test/spec/desktop/*.js'],
                options: mochaOpts
            },
            android: {
                src: ['./test/setup.js', 'test/spec/mobile/*.js', 'test/spec/mobile/android/*.js'],
                options: mochaOpts
            },
            ios: {
                src: ['./test/setup.js', 'test/spec/mobile/*.js', 'test/spec/mobile/ios/*.js'],
                options: mochaOpts
            },
            unit: {
                src: ['./test/setup-unit.js', 'test/spec/unit/*.js'],
                options: mochaOpts
            },
            wdio: {
                src: ['./test/setup-unit.js', 'test/spec/wdio/*.js'],
                options: mochaOpts
            }
        },
        eslint: {
            options: {
                parser: 'babel-eslint'
            },
            target: ['lib/**/*.js', '!lib/scripts/*', '!test/spec', '!test/conf']
        },
        contributors: {
            options: {
                commitMessage: 'update contributors'
            }
        },
        bump: {
            options: {
                commitMessage: 'v%VERSION%',
                pushTo: 'upstream'
            }
        },
        watch: {
            commands: {
                files: 'lib/commands/*.js',
                tasks: ['babel:commands'],
                options: {
                    spawn: false
                }
            },
            protocol: {
                files: 'lib/protocol/*.js',
                tasks: ['babel:protocol'],
                options: {
                    spawn: false
                }
            },
            core: {
                files: ['lib/*.js', 'lib/helpers/*.js', 'lib/utils/*.js', 'index.js'],
                tasks: ['babel:core'],
                options: {
                    spawn: false
                }
            }
        },
        copy: {
            packagejson: {
                src: 'package.json',
                dest: 'build/'
            },
            ejstemplate: {
                src: 'lib/helpers/wdio.conf.ejs',
                dest: 'build/'
            }
        },
        connect: {
            testpage: {
                options: {
                    port: 8080,
                    base: './test/site/www'
                }
            }
        }
    })

    require('load-grunt-tasks')(grunt)
    grunt.registerTask('default', ['build'])
    grunt.registerTask('build', 'Build wdio-mocha', function () {
        grunt.task.run([
            'eslint',
            'clean',
            'babel',
            'copy'
        ])
    })
    grunt.registerTask('release', 'Bump and tag version', function (type) {
        grunt.task.run([
            'build',
            'contributors',
            'bump:' + (type || 'patch')
        ])
    })

    grunt.registerTask('test', function (env, cmd) {
        cmd = cmd || 'mochaTest'
        env = env || process.env._ENV || 'desktop'

        /**
         * quick set up for dev
         */
        if (!process.env.CI && env === 'ios') {
            process.env._PLATFORM = 'iOS'
            process.env._VERSION = '9.2'
            process.env._DEVICENAME = 'iPhone 6'
            process.env._APP = __dirname + '/test/site/platforms/ios/build/emulator/WebdriverJS Example Phonegap Application.app'
        } else if (!process.env.CI && env === 'android') {
            process.env._PLATFORM = 'Android'
            process.env._VERSION = '4.4'
            process.env._DEVICENAME = 'Samsung Galaxy S4 Emulator'
            process.env._APP = __dirname + '/test/site/platforms/android/build/outputs/apk/android-debug.apk'
        }

        var tasks = ['connect', cmd + ':' + env]

        addEnv({ _ENV: env })
        process.env._ENV = env

        grunt.task.run(tasks)
    })

    grunt.registerTask('testcover', function (env) {
        env = env || process.env._ENV

        if (typeof env !== 'string') {
            throw new Error('no proper environment specified')
        }

        return grunt.task.run('test:' + env + ':mocha_istanbul')
    })
}
