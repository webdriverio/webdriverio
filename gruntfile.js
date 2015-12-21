var os = require('os')

module.exports = function (grunt) {
    var argv = require('optimist').argv

    var mochaInstanbulOpts = {
        scriptPath: require.resolve('isparta/bin/isparta'),
        reporter: 'spec',
        mochaOptions: ['--compilers', 'js:babel/register', '--recursive', '-t', '60000']
    }

    var mochaOpts = {
        reporter: 'spec',
        require: ['babel/register'],
        grep: argv.grep,
        invert: argv.invert,
        bail: argv.bail,
        timeout: 20000
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
            mobile: {
                src: ['./test/setup.js', 'test/spec/mobile/**/*.js'],
                options: mochaInstanbulOpts
            },
            desktop: {
                src: ['./test/setup.js', 'test/spec/addValue.js'],
                options: mochaInstanbulOpts
            }
        },
        mochaTest: {
            functional: {
                src: ['./test/setup.js', 'test/spec/functional/**/*.js'],
                options: mochaOpts
            },
            mobile: {
                src: ['./test/setup.js', 'test/spec/mobile/**/*.js'],
                options: mochaOpts
            },
            desktop: {
                src: ['./test/setup.js', 'test/spec/*.js', 'test/spec/desktop/*.js'],
                options: mochaOpts
            }
        },
        'start-selenium-server': {
            dev: {
                options: {
                    autostop: false,
                    downloadUrl: 'https://selenium-release.storage.googleapis.com/2.47/selenium-server-standalone-2.47.0.jar',
                    downloadLocation: os.tmpdir(),
                    serverOptions: {},
                    systemProperties: {}
                }
            }
        },
        'stop-selenium-server': {
            dev: {}
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

    grunt.registerTask('run-test', function () {
        grunt.task.run('env', 'config', 'connect', 'start-selenium-server', 'mochaTest', 'passfail')
    })

    grunt.registerTask('test', function (env, cmd, isSeleniumServerRunning) {
        isSeleniumServerRunning = isSeleniumServerRunning === undefined ? true : isSeleniumServerRunning
        cmd = cmd || 'mochaTest'
        env = env || 'desktop'
        var tasks = [cmd + ':' + env]

        addEnv({ _ENV: env })
        process.env._ENV = env

        if (!isSeleniumServerRunning && (env === 'functional' || (env === 'desktop' && !process.env.CI))) {
            tasks.unshift('start-selenium-server:dev')
            tasks.push('stop-selenium-server:dev')
        }

        grunt.task.run(tasks)
    })

    grunt.registerTask('testcover', function (env, isSeleniumServerRunning) {
        env = env || process.env._ENV

        if (typeof env !== 'string') {
            throw new Error('no proper environment specified')
        }

        return grunt.task.run('test:' + env + ':mocha_istanbul:' + isSeleniumServerRunning)
    })
}
