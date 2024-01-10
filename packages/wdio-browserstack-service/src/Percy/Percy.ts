import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

import { spawn } from 'node:child_process'

import { nodeRequest, getBrowserStackUser, getBrowserStackKey, sleep } from '../util.js'
import { PercyLogger } from './PercyLogger.js'

import PercyBinary from './PercyBinary.js'

import type { BrowserstackConfig, UserConfig } from '../types.js'
import type { Options } from '@wdio/types'

const logDir = 'logs'

class Percy {
    #logfile: string = path.join(logDir, 'percy.log')
    #address: string = process.env.PERCY_SERVER_ADDRESS || 'http://127.0.0.1:5338'

    #binaryPath: string | any = null
    #options: BrowserstackConfig & Options.Testrunner
    #config: Options.Testrunner
    #proc: any = null
    #isApp: boolean
    #projectName: string | undefined = undefined

    isProcessRunning = false

    constructor(options: BrowserstackConfig & Options.Testrunner, config: Options.Testrunner, bsConfig: UserConfig) {
        this.#options = options
        this.#config = config
        this.#isApp = Boolean(options.app)
        this.#projectName = bsConfig.projectName
    }

    async #getBinaryPath(): Promise<string> {
        if (!this.#binaryPath) {
            const pb = new PercyBinary()
            this.#binaryPath = await pb.getBinaryPath(this.#config)
        }
        return this.#binaryPath
    }

    async healthcheck() {
        try {
            const resp = await nodeRequest('GET', 'percy/healthcheck', null, this.#address)
            if (resp) {
                return true
            }
        } catch (err) {
            return false
        }
    }

    async start() {
        const binaryPath: string = await this.#getBinaryPath()
        const logStream = fs.createWriteStream(this.#logfile, { flags: 'a' })
        const token = await this.fetchPercyToken()
        const configPath = await this.createPercyConfig()

        if (!token) {
            return false
        }

        const commandArgs = [`${this.#isApp ? 'app:exec' : 'exec'}:start`]

        if (configPath) {
            commandArgs.push('-c', configPath as string)
        }

        this.#proc = spawn(
            binaryPath,
            commandArgs,
            { env: { ...process.env, PERCY_TOKEN: token } }
        )

        this.#proc.stdout.pipe(logStream)
        this.#proc.stderr.pipe(logStream)
        this.isProcessRunning = true
        const that = this

        this.#proc.on('close', function () {
            that.isProcessRunning = false
        })

        do {
            const healthcheck = await this.healthcheck()
            if (healthcheck) {
                PercyLogger.debug('Percy healthcheck successful')
                return true
            }

            await sleep(1000)
        } while (this.isProcessRunning)

        return false
    }

    async stop() {
        const binaryPath = await this.#getBinaryPath()
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
        const projectName = this.#projectName

        try {
            const type = this.#isApp ? 'app' : 'automate'
            const response = await nodeRequest(
                'GET',
                `api/app_percy/get_project_token?name=${projectName}&type=${type}`,
                {
                    username: getBrowserStackUser(this.#config),
                    password: getBrowserStackKey(this.#config)
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
        if (!this.#options.percyOptions) {
            return null
        }

        const configPath = path.join(os.tmpdir(), 'percy.json')
        const percyOptions = this.#options.percyOptions

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
