import logger from '@wdio/logger'
import { createWriteStream, ensureFileSync } from 'fs-extra'
import { spawn } from 'child_process'
import { promisify } from 'util'
import getFilePath from './utils/getFilePath'

const log = logger('@wdio/appium-service')
const DEFAULT_LOG_FILENAME = 'appium.txt'

export class AppiumLauncher {
    constructor() {
        this.logPath = null
        this.command = ''
        this.appiumArgs = []
    }

    async onPrepare(config) {
        const appiumConfig = config.appium || {}

        this.logPath = appiumConfig.logPath
        this.command = appiumConfig.command || this._getAppiumCommand()
        this.appiumArgs = this._cliArgsFromKeyValue(appiumConfig.args || {})

        const asyncStartAppium = promisify(this._startAppium)
        this.process = await asyncStartAppium(this.command, this.appiumArgs)

        if (typeof this.logPath === 'string') {
            this._redirectLogStream(this.logPath)
        }
    }

    onComplete() {
        if(this.process) {
            log.debug(`Appium (pid: ${process.pid}) killed`)
            this.process.kill()
        }
    }

    _startAppium(command, args, callback) {
        log.debug(`Will spawn Appium process: ${command} ${args.join(' ')}`)
        let process = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] })

        const exitCallback = (exitCode) => {
            clearTimeout(timer)
            callback(new Error(`Appium exited before timeout (exit code: ${exitCode})`), null)
        }

        const timer = setTimeout(() => {
            process.removeListener('exit', exitCallback)
            log.debug(`Appium started with ID: ${process.pid}`)
            callback(null, process)
        }, 1000)

        process.once('exit', exitCallback)
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

    _getAppiumCommand() {
        return /^win/.test(process.platform) ? 'appium.cmd' : 'appium'
    }

    _cliArgsFromKeyValue(keyValueArgs) {
        const cliArgs = []
        for (let key in keyValueArgs) {
            const value = keyValueArgs[key]
            // If the value is false or null the argument is discarded
            if ((typeof value === 'boolean' && !value) || value === null) {
                continue
            }

            cliArgs.push(this._lowerCamelToCliOptionName(key))

            // Only non-boolean and non-null values are added as option values
            if (typeof value !== 'boolean' && value !== null) {
                cliArgs.push(this._sanitizeCliOptionValue(value))
            }
        }
        return cliArgs
    }

    _lowerCamelToCliOptionName(camelCasedKey) {
        let cliOptionName = '--'
        const bigACharCode = 'A'.charCodeAt(0)
        const bigZCharCode = 'Z'.charCodeAt(0)
        for (let charIndex = 0; charIndex < camelCasedKey.length; ++charIndex) {
            const char = camelCasedKey.charAt(charIndex)
            const charCode = camelCasedKey.charCodeAt(charIndex)
            // If the character between A and Z replace it with a dash and a small char
            if (charCode >= bigACharCode && charCode <= bigZCharCode) {
                cliOptionName += `-${char.toLowerCase()}`
            } else {
                cliOptionName += char
            }
        }
        return cliOptionName
    }

    _sanitizeCliOptionValue(value) {
        const valueString = String(value)
        // Encapsulate the value string in single quotes if it contains a white space
        return /\s/.test(valueString) ? `'${valueString}'` : valueString
    }
}
