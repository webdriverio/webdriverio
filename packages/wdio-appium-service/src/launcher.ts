import logger from '@wdio/logger'
import { ChildProcessByStdio, spawn } from 'child_process'
import { createWriteStream, ensureFileSync } from 'fs-extra'
import { promisify } from 'util'
import { getFilePath, cliArgsFromKeyValue, cliArgsFromArray } from './utils'
import { Readable } from 'stream'
import { isCloudCapability } from '@wdio/config'

const log = logger('@wdio/appium-service')
const DEFAULT_LOG_FILENAME = 'wdio-appium.log'

const DEFAULT_CONNECTION = {
    protocol: 'http',
    hostname: 'localhost',
    port: 4723,
    path: '/'
}

export default class AppiumLauncher implements WebdriverIO.ServiceInstance {
    private readonly _logPath?: string
    private readonly _basePath: string = '/'
    private readonly _command: string
    private readonly _appiumArgs: Array<string> = []
    private readonly _capabilities: Array<AppiumCapability>
    private readonly _args: KeyValueArgs | ArgValue[]
    private _process?: ChildProcessByStdio<null, Readable, Readable>

    constructor(
        private options: AppiumOptions,
        capabilities: Array<AppiumCapability> | AppiumCapability = {},
        public config?: Config
    ) {
        /**
         * Convert capability object to Array of capabilities
         */
        this.capabilities = Array.isArray(capabilities)
            ? capabilities
            : Object.values(capabilities)
        this.args = {
            basePath: this.basePath,
            ...(this.options.args || {})
        }
        this._logPath = options.logPath || config?.outputDir
        this.command = options.command

        /**
         * Windows expects node to be explicitly set as command and appium
         * module path as it's first argument
         */
        if (!this.command) {
            this.command = 'node'
            this.appiumArgs.push(AppiumLauncher._getAppiumCommand())
        }
    }

    /**
     * update capability connection options to connect
     * to Appium server
     */
    private _setCapabilities() {
        this.capabilities.forEach(
            (cap) => !isCloudCapability(cap) && Object.assign(
                cap,
                DEFAULT_CONNECTION,
                'port' in this.args ? { port: this.args.port } : {},
                { path: this.basePath },
                { ...cap }
            ))
    }

    async onPrepare() {
        const isWindows = process.platform === 'win32'

        /**
         * Append remaining arguments
         */
        if (Array.isArray(this.args)) {
            this.appiumArgs.push(...cliArgsFromArray(this.args))
        } else {
            this.appiumArgs.push(...cliArgsFromKeyValue(this.args))
        }

        /**
         * Windows needs to be started through `cmd` and the command needs to be an arg
         */
        if (isWindows) {
            this.appiumArgs.unshift('/c', this.command)
            this.command = 'cmd'
        }

        this._setCapabilities()

        /**
         * start Appium
         */
        this.process = await promisify(this._startAppium)(this.command, this.appiumArgs)

        if (this._logPath) {
            this._redirectLogStream(this._logPath)
        }
    }

    onComplete() {
        if (this.process) {
            log.debug(`Appium (pid: ${process.pid}) killed`)
            this.process.kill()
        }
    }

    private _startAppium(command: string, args: Array<string>, callback: (err: any, result: any) => void): void {
        log.debug(`Will spawn Appium process: ${command} ${args.join(' ')}`)
        let process: ChildProcessByStdio<null, Readable, Readable> = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })
        let error: Error | undefined

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

    private _redirectLogStream(logPath: string) {
        if (!this.process){
            throw Error('No Appium process to redirect log stream')
        }
        const logFile = getFilePath(logPath, DEFAULT_LOG_FILENAME)

        // ensure file & directory exists
        ensureFileSync(logFile)

        log.debug(`Appium logs written to: ${logFile}`)
        const logStream = createWriteStream(logFile, { flags: 'w' })
        this.process.stdout.pipe(logStream)
        this.process.stderr.pipe(logStream)
    }

    private static _getAppiumCommand (moduleName = 'appium') {
        try {
            return require.resolve(moduleName)
        } catch (err) {
            log.error(
                'Appium is not installed locally.\n' +
                'If you use globally installed appium please add\n' +
                "appium: { command: 'appium' }\n" +
                'to your wdio.conf.js!'
            )
            throw err
        }
    }
}
