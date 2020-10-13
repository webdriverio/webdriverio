import logger from '@wdio/logger'
import { isCloudCapability } from '@wdio/config'

import { spawn } from 'child_process'
import { createWriteStream, ensureFileSync } from 'fs-extra'
import { promisify } from 'util'
import { getFilePath, getAppiumCommand, cliArgsFromKeyValue } from './utils'

const log = logger('@wdio/appium-service')
const DEFAULT_LOG_FILENAME = 'wdio-appium.log'

const DEFAULT_CONNECTION = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4723,
    path: '/'
}

export default class AppiumLauncher {
    constructor(options, capabilities, config) {
        this.options = options
        this.capabilities = capabilities
        this.args = {
            basePath: '/',
            ...(options.args || {})
        }
        this.logPath = options.logPath || config.outputDir
        this.command = options.command
        this.appiumArgs = []

        /**
         * Windows expects node to be explicitely set as command and appium
         * module path as it's first argument
         */
        if (!this.command) {
            this.command = 'node'
            this.appiumArgs.push(getAppiumCommand())
        }
    }

    async onPrepare() {
        const isWindows = process.platform === 'win32'

        /**
         * Append remaining arguments
         */
        this.appiumArgs.push(...cliArgsFromKeyValue(this.args))

        /**
         * Windows needs to be started through `cmd` and the command needs to be an arg
         */
        if (isWindows) {
            this.appiumArgs.unshift('/c', this.command)
            this.command = 'cmd'
        }

        /**
         * update capability connection options to connect
         * to Appium server
         */
        (
            Array.isArray(this.capabilities)
                ? this.capabilities
                : Object.values(this.capabilities)
        ).forEach((cap) => !isCloudCapability(cap.capabilities) && Object.assign(
            cap,
            DEFAULT_CONNECTION,
            this.args.port ? { port: this.args.port } : {},
            { path: this.args.basePath },
            { ...cap }
        ))

        /**
         * start Appium
         */
        this.process = await promisify(this._startAppium)(this.command, this.appiumArgs)

        if (typeof this.logPath === 'string') {
            this._redirectLogStream(this.logPath)
        }
    }

    onComplete() {
        if (this.process) {
            log.debug(`Appium (pid: ${process.pid}) killed`)
            this.process.kill()
        }
    }

    _startAppium(command, args, callback) {
        log.debug(`Will spawn Appium process: ${command} ${args.join(' ')}`)
        let process = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
        let error

        process.stdout.on('data', (data) => {
            if (data.includes('Appium REST http interface listener started')) {
                log.debug(`Appium started with ID: ${process.pid}`)
                callback(null, process)
            }
        })

        /**
         * only capture first error to print it in case Appium failed to start.
         */
        process.stderr.once('data', err => { error = err })

        process.once('exit', (exitCode) => {
            let errorMessage = `Appium exited before timeout (exit code: ${exitCode})`
            if (exitCode == 2) {
                errorMessage += '\n' + (error || 'Check that you don\'t already have a running Appium service.')
                log.error(errorMessage)
            }
            callback(new Error(errorMessage), null)
        })
    }

    _redirectLogStream(logPath) {
        const logFile = getFilePath(logPath, DEFAULT_LOG_FILENAME)

        // ensure file & directory exists
        ensureFileSync(logFile)

        log.debug(`Appium logs written to: ${logFile}`)
        const logStream = createWriteStream(logFile, { flags: 'w' })
        this.process.stdout.pipe(logStream)
        this.process.stderr.pipe(logStream)
    }
}
