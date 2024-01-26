import fs from 'node:fs'
import fsp from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
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

export default class AppiumLauncher implements Services.ServiceInstance {
    private readonly _logPath?: string
    private readonly _appiumCliArgs: string[] = []
    private readonly _args: AppiumServerArguments
    private _process?: ChildProcessByStdio<null, Readable, Readable>

    constructor(
        private _options: AppiumServiceConfig,
        private _capabilities: Capabilities.RemoteCapabilities,
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
        if (process.platform === 'win32') {
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
        /**
         * Multiremote sessions
         */
        if (!Array.isArray(this._capabilities)) {
            for (const [, capability] of Object.entries(this._capabilities)) {
                const cap = (capability.capabilities as Capabilities.W3CCapabilities) || capability
                const c = (cap as Capabilities.W3CCapabilities).alwaysMatch || cap
                !isCloudCapability(c) && isAppiumCapability(c) && Object.assign(
                    capability,
                    DEFAULT_CONNECTION,
                    { path: this._args.basePath, port },
                    { ...capability }
                )
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
                Object.assign(
                    cap,
                    DEFAULT_CONNECTION,
                    { path: this._args.basePath, port },
                    { ...cap }
                )
            }
        })
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
         * Append remaining arguments
         */
        this._appiumCliArgs.push(...formatCliArgs(this._args))

        /**
         * Get port from service option or use a random port
         */
        const port = typeof this._args.port === 'number'
            ? this._args.port
            : await getPort({ port: DEFAULT_APPIUM_PORT })
        this._setCapabilities(port)

        /**
         * start Appium
         */
        const command = await this._getCommand(this._options.command)
        this._process = await this._startAppium(command, this._appiumCliArgs)

        if (this._logPath) {
            this._redirectLogStream(this._logPath)
        }
    }

    onComplete() {
        if (this._process) {
            log.info(`Appium (pid: ${this._process.pid}) killed`)
            this._process.kill()
        }
    }
    private _startAppium(command: string, args: Array<string>, timeout:number = 60000) {
        log.info(`Will spawn Appium process: ${command} ${args.join(' ')}`)
        const process: ChildProcessByStdio<null, Readable, Readable> = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
        // just for validate the first error
        let errorCaptured = false;
        // to set a timeout for the promise
        let timeoutId:number;
        // to store the first error
        let error: Error | undefined

        return new Promise<ChildProcessByStdio<null, Readable, Readable>>((resolve, reject) => {
            process.stdout.on('data', (data) => {
                if (data.includes('Appium REST http interface listener started')) {
                    log.info(`Appium started with ID: ${process.pid}`)
                    resolve(process)
                }
                // if the data does not include the above string, it is probably an error or debugger message.
                log.warn(data.toString())
                resolve('The appium service is starting... Check logs above for possible issues.')
            })

            /**
             * only capture first error to print it in case Appium failed to start.
             */
            process.stderr.once('data', (err) => {
                error = (err || new Error('Appium exited without unknown error message')) as Error
                log.error(error.toString());
                rejectOnce(error);

            })

            process.once('exit', (exitCode: number) => {
                let errorMessage = `Appium exited before timeout (exit code: ${exitCode})`
                if (exitCode === 2) {
                    errorMessage += '\n' + (error?.toString() || 'Check that you don\'t already have a running Appium service.')
                } else if (errorCaptured) {
                    errorMessage += `\n${error?.toString()}`;
                }
                if (exitCode !== 0) {
                    log.error(errorMessage)
                }
                rejectOnce(new Error(errorMessage))
            })

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
             * set timeout for promise. If Appium does not start within given timeout,
             * e.g. if the port is already in use, reject the promise.
             */
            timeoutId = setTimeout(() => {
                rejectOnce(new Error("Timeout: Appium did not start within expected time"));
            }, timeout);
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
