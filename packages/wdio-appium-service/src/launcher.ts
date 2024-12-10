import os from 'node:os'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import treeKill from 'tree-kill'
import { spawn, type ChildProcessByStdio } from 'node:child_process'
import { type Readable } from 'node:stream'

import logger from '@wdio/logger'
import getPort from 'get-port'
import { resolve } from 'import-meta-resolve'
import { isCloudCapability } from '@wdio/config'
import { SevereServiceError } from 'webdriverio'
import type { Services, Capabilities, Options } from '@wdio/types'
import { isAppiumCapability } from '@wdio/utils'

import { getFilePath, formatCliArgs } from './utils.js'
import type { AppiumServerArguments, AppiumServiceConfig } from './types.js'

const log = logger('@wdio/appium-service')
const DEFAULT_APPIUM_PORT = 4723
const DEFAULT_LOG_FILENAME = 'wdio-appium.log'
const DEFAULT_CONNECTION = {
    protocol: 'http',
    hostname: '127.0.0.1',
    path: '/'
}
const APPIUM_START_TIMEOUT = 30 * 1000

export default class AppiumLauncher implements Services.ServiceInstance {
    private readonly _logPath?: string
    private readonly _appiumCliArgs: string[] = []
    private readonly _args: AppiumServerArguments
    private _process?: ChildProcessByStdio<null, Readable, Readable>
    private _isShuttingDown: boolean = false

    constructor(
        private _options: AppiumServiceConfig,
        private _capabilities: Capabilities.TestrunnerCapabilities,
        private _config?: Options.Testrunner
    ) {
        this._args = {
            basePath: DEFAULT_CONNECTION.path,
            ...(this._options.args || {})
        }
        this._logPath = _options.logPath || this._config?.outputDir
    }

    private async _getCommand(command?: string) {
        /**
         * Explicitly set node as command and appium
         * module path as it's first argument if it's not defined
         */
        if (!command) {
            command = 'node'
            this._appiumCliArgs.unshift(await AppiumLauncher._getAppiumCommand())
        }

        /**
         * Windows needs to be started through `cmd` and the command needs to be an arg
         */
        if (os.platform() === 'win32') {
            this._appiumCliArgs.unshift('/c', command)
            command = 'cmd'
        }

        return command
    }

    /**
     * update capability connection options to connect
     * to Appium server
     */
    private _setCapabilities(port: number) {
        let capabilityWasUpdated = false

        /**
         * Multiremote sessions
         */
        if (!Array.isArray(this._capabilities)) {
            for (const [, capability] of Object.entries(this._capabilities)) {
                const cap = (capability.capabilities as Capabilities.W3CCapabilities) || capability
                const c = (cap as Capabilities.W3CCapabilities).alwaysMatch || cap
                if (!isCloudCapability(c) && isAppiumCapability(c)) {
                    capabilityWasUpdated = true
                    Object.assign(
                        capability,
                        DEFAULT_CONNECTION,
                        { path: this._args.basePath, port },
                        { ...capability }
                    )
                }
            }
            return
        }

        this._capabilities.forEach((cap) => {
            const w3cCap = cap as Capabilities.W3CCapabilities

            /**
             * Parallel Multiremote
             */
            if (Object.values(cap).length > 0 && Object.values(cap).every(c => typeof c === 'object' && c.capabilities)) {
                Object.values(cap).forEach(c => {
                    const capability = (c.capabilities as Capabilities.W3CCapabilities).alwaysMatch || (c.capabilities as Capabilities.W3CCapabilities) || c
                    if (!isCloudCapability(capability) && isAppiumCapability(capability)) {
                        capabilityWasUpdated = true
                        Object.assign(
                            c,
                            DEFAULT_CONNECTION,
                            { path: this._args.basePath, port },
                            { ...c }
                        )
                    }
                }
                )
            } else if (!isCloudCapability(w3cCap.alwaysMatch || cap) && isAppiumCapability(w3cCap.alwaysMatch || cap)) {
                capabilityWasUpdated = true
                Object.assign(
                    cap,
                    DEFAULT_CONNECTION,
                    { path: this._args.basePath, port },
                    { ...cap }
                )
            }
        })

        return capabilityWasUpdated
    }

    async onPrepare() {
        /**
         * Throws an error if `this._options.args` is defined and is an array.
         * @throws {Error} If `this._options.args` is an array.
         */
        if (Array.isArray(this._options.args)) {
            throw new Error('Args should be an object')
        }

        /**
         * Use port from service option or get a random port
         */
        this._args.port = typeof this._args.port === 'number' ? this._args.port
            : await getPort({ port: DEFAULT_APPIUM_PORT })

        /**
         * only actually start Appium server if we detect a capability that
         * would indicate a that a local Appium session is needed
         */
        const capabilityWasUpdated = this._setCapabilities(this._args.port)
        if (!capabilityWasUpdated) {
            log.warn('Could not identify any capability that indicates a local Appium session, skipping Appium launch')
            return
        }

        /**
         * Append cli arguments
         */
        this._appiumCliArgs.push(...formatCliArgs({ ...this._args }))

        /**
         * start Appium
         */
        const command = await this._getCommand(this._options.command)
        this._process = await this._startAppium(command, this._appiumCliArgs)

        if (this._logPath) {
            this._redirectLogStream(this._logPath)
        } else {
            log.info('Appium logs written to stdout')
            this._process.stdout.on('data', this.#logStdout)
            this._process.stderr.on('data', this.#logStderr)
        }
    }

    #logStdout = (data: Buffer) => {
        log.debug(data.toString())
    }

    #logStderr = (data: Buffer) => {
        log.warn(data.toString())
    }

    onComplete() {
        this._isShuttingDown = true

        /**
         * Kill appium and all process' spawned from it
         */
        if (this._process && this._process.pid) {
            /**
             * remove stdio event listener
             */
            this._process.stdout.off('data', this.#logStdout)
            this._process.stderr.off('data', this.#logStderr)

            /**
             * Ensure all child processes are also killed
             */
            log.info('Killing entire Appium tree')
            treeKill(this._process.pid, 'SIGTERM', (err) => {
                if (err) {
                    return log.warn('Failed to kill process:', err)
                }

                log.info('Process and its children successfully terminated')
            })
        }
    }
    private _startAppium(command: string, args: Array<string>, timeout = APPIUM_START_TIMEOUT) {
        log.info(`Will spawn Appium process: ${command} ${args.join(' ')}`)
        const appiumProcess: ChildProcessByStdio<null, Readable, Readable> = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
        // just for validate the first error
        let errorCaptured = false
        // to set a timeout for the promise
        let timeoutId: NodeJS.Timeout
        // to store the first error message
        let error: string

        return new Promise<ChildProcessByStdio<null, Readable, Readable>>((resolve, reject) => {
            let outputBuffer = ''

            /**
             * set timeout for promise. If Appium does not start within given timeout,
             * e.g. if the port is already in use, reject the promise.
             */
            timeoutId = setTimeout(() => {
                rejectOnce(new Error('Timeout: Appium did not start within expected time'))
            }, timeout)

            /**
             * reject promise if Appium does not start within given timeout,
             * e.g. if the port is already in use
             *
             * @param err - error to reject with
             */
            const rejectOnce = (err: Error) => {
                if (!errorCaptured) {
                    errorCaptured = true
                    clearTimeout(timeoutId)
                    reject(err)
                }
            }

            /**
             * only capture first error to print it in case Appium failed to start.
             */
            const onErrorMessage = (data: Buffer) => {
                error = data.toString() || 'Appium exited without unknown error message'
                log.error(error)
                rejectOnce(new Error(error))
            }

            const onStdout = (data: Buffer) => {
                outputBuffer += data.toString()
                if (outputBuffer.includes('Appium REST http interface listener started')) {
                    outputBuffer = ''
                    log.info(`Appium started with ID: ${appiumProcess.pid}`)
                    clearTimeout(timeoutId)

                    appiumProcess.stdout.off('data', onStdout)
                    appiumProcess.stderr.off('data', onErrorMessage)
                    resolve(appiumProcess)
                }
            }

            appiumProcess.stdout.on('data', onStdout)
            appiumProcess.stderr.once('data', onErrorMessage)
            appiumProcess.once('exit', (exitCode: number) => {
                if (this._isShuttingDown) {
                    return
                }
                let errorMessage = `Appium exited before timeout (exit code: ${exitCode})`
                if (exitCode === 2) {
                    errorMessage += '\n' + (error?.toString() || 'Check that you don\'t already have a running Appium service.')
                } else if (errorCaptured) {
                    errorMessage += `\n${error?.toString()}`
                }
                if (exitCode !== 0) {
                    log.error(errorMessage)
                }
                rejectOnce(new Error(errorMessage))
            })
        })
    }

    private async _redirectLogStream(logPath: string) {
        if (!this._process){
            throw Error('No Appium process to redirect log stream')
        }
        const logFile = getFilePath(logPath, DEFAULT_LOG_FILENAME)

        // ensure file & directory exists
        await fsp.mkdir(path.dirname(logFile), { recursive: true })

        log.debug(`Appium logs written to: ${logFile}`)
        const logStream = fs.createWriteStream(logFile, { flags: 'w' })
        this._process.stdout.pipe(logStream)
        this._process.stderr.pipe(logStream)
    }

    private static async _getAppiumCommand (command = 'appium') {
        try {
            const entryPath = await resolve(command, import.meta.url)
            return url.fileURLToPath(entryPath)
        } catch (err: any) {
            const errorMessage = (
                'Appium is not installed locally. Please install via e.g. `npm i --save-dev appium`.\n' +
                'If you use globally installed appium please add: `appium: { command: \'appium\' }`\n' +
                'to your wdio.conf.js!\n\n' +
                err.stack
            )
            log.error(errorMessage)
            throw new SevereServiceError(errorMessage)
        }
    }
}
