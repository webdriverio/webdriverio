import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { spawn } from 'node:child_process'

import { nodeRequest, getBrowserStackUser, getBrowserStackKey } from '../util'
import { PercyLogger } from './PercyLogger'

import PercyBinary from './PercyBinary'

import type { BrowserstackConfig, UserConfig } from '../types'
import type { Options } from '@wdio/types'

const logDir = 'logs'

class Percy {
    _logfile: string = path.join(logDir, 'percy.log')
    _address: string = process.env.PERCY_SERVER_ADDRESS || 'http://127.0.0.1:5338'

    _binaryPath: string | any = null
    _options: BrowserstackConfig & Options.Testrunner
    _config: Options.Testrunner
    _proc: any = null
    _isApp: boolean
    _projectName: string | undefined = undefined

    isProcessRunning = false

    constructor(options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner, bsConfig: UserConfig) {
        this._options = options
        this._config = config
        this._isApp = Boolean(options.app)
        this._projectName = bsConfig.projectName
    }

    private async getBinaryPath(): Promise<string> {
        if (!this._binaryPath) {
            const pb = new PercyBinary()
            this._binaryPath = await pb.getBinaryPath(this._config)
        }
        return this._binaryPath
    }

    private async sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    async healthcheck() {
        try {
            const resp = await nodeRequest('GET', 'percy/healthcheck', null, this._address)
            if (resp) {
                return true
            }
        } catch (err) {
            return false
        }
    }

    async start() {
        const binaryPath: string = await this.getBinaryPath()
        const logStream = fs.createWriteStream(this._logfile, { flags: 'a' })
        const token = await this.fetchPercyToken()
        const configPath = await this.createPercyConfig()

        if (!token) {
            return false
        }

        const commandArgs = [`${this._isApp ? 'app:exec' : 'exec'}:start`]

        if (configPath) {
            commandArgs.push('-c', configPath as string)
        }

        this._proc = spawn(
            binaryPath,
            commandArgs,
            { env: { ...process.env, PERCY_TOKEN: token } }
        )

        this._proc.stdout.pipe(logStream)
        this._proc.stderr.pipe(logStream)
        this.isProcessRunning = true
        const that = this

        this._proc.on('close', function () {
            that.isProcessRunning = false
        })

        do {
            const healthcheck = await this.healthcheck()
            if (healthcheck) {
                PercyLogger.debug('Percy healthcheck successful')
                return true
            }

            await this.sleep(1000)
        } while (this.isProcessRunning)

        return false
    }

    async stop() {
        const binaryPath = await this.getBinaryPath()
        return new Promise( (resolve) => {
            const proc = spawn(binaryPath, ['exec:stop'])
            proc.on('close', (code: any) => {
                this.isProcessRunning = false
                resolve(code)
            })
        })
    }

    isRunning() {
        return this.isProcessRunning
    }

    async fetchPercyToken() {
        const projectName = this._projectName

        try {
            const type = this._isApp ? 'app' : 'automate'
            const response: any = await nodeRequest(
                'GET',
                `api/app_percy/get_project_token?name=${projectName}&type=${type}`,
                {
                    username: getBrowserStackUser(this._config),
                    password: getBrowserStackKey(this._config)
                },
                'https://api.browserstack.com'
            )
            PercyLogger.debug('Percy fetch token success : ' + response.token)
            return response.token
        } catch (err: any) {
            PercyLogger.error(`Percy unable to fetch project token: ${err}`)
            return null
        }
    }

    async createPercyConfig() {
        if (!this._options.percyOptions) {
            return null
        }

        const configPath = path.join(os.tmpdir(), 'percy.json')
        const percyOptions = this._options.percyOptions

        if (!percyOptions.version) {
            percyOptions.version = '2'
        }

        return new Promise((resolve) => {
            fs.writeFile(
                configPath,
                JSON.stringify(
                    percyOptions
                ),
                (err: any) => {
                    if (err) {
                        PercyLogger.error(`Error creating percy config: ${err}`)
                        resolve(null)
                    }

                    PercyLogger.debug('Percy config created at ' + configPath)
                    resolve(configPath)
                }
            )
        })
    }
}

export default Percy
