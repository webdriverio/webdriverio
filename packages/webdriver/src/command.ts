import type { ChildProcess } from 'node:child_process'
import logger from '@wdio/logger'
import { commandCallStructure, isValidParameter, getArgumentType } from '@wdio/utils'
import type { CommandEndpoint, BidiResponse } from '@wdio/protocols'

import RequestFactory from './request/factory.js'
import type { BidiHandler } from './bidi/handler.js'
import type { WebDriverResponse } from './request/index.js'
import type { BaseClient } from './types.js'

const log = logger('webdriver')
const BIDI_COMMANDS = ['send', 'sendAsync'] as const

interface BaseClientWithEventHandler extends BaseClient {
    eventMiddleware: BidiHandler
    _driverProcess?: ChildProcess
}

export default function (
    method: string,
    endpointUri: string,
    commandInfo: CommandEndpoint,
    doubleEncodeVariables = false
) {
    const { command, ref, parameters, variables = [], isHubCommand = false } = commandInfo

    return async function protocolCommand (this: BaseClientWithEventHandler, ...args: any[]): Promise<WebDriverResponse | BidiResponse | void> {
        const isBidiCommand = this.sessionId && this.eventMiddleware && typeof this.eventMiddleware[command as keyof typeof this.eventMiddleware] === 'function'
        let endpoint = endpointUri // clone endpointUri in case we change it
        const commandParams = [...variables.map((v) => Object.assign(v, {
            /**
             * url variables are:
             */
            required: true, // always required as they are part of the endpoint
            type: 'string'  // have to be always type of string
        })), ...parameters]

        const commandUsage = `${command}(${commandParams.map((p) => p.name).join(', ')})`
        const moreInfo = `\n\nFor more info see ${ref}\n`
        const body: Record<string, any> = {}

        /**
         * parameter check
         */
        const minAllowedParams = commandParams.filter((param) => param.required).length
        if (!isBidiCommand && args.length < minAllowedParams || args.length > commandParams.length) {
            const parameterDescription = commandParams.length
                ? `\n\nProperty Description:\n${commandParams.map((p) => `  "${p.name}" (${p.type}): ${p.description}`).join('\n')}`
                : ''

            throw new Error(
                `Wrong parameters applied for ${command}\n` +
                `Usage: ${commandUsage}` +
                parameterDescription +
                moreInfo
            )
        }

        /**
         * parameter type check
         */
        for (const [it, arg] of Object.entries(args)) {
            if (isBidiCommand) {
                break
            }
            const i = parseInt(it, 10)
            const commandParam = commandParams[i]

            if (!isValidParameter(arg, commandParam.type)) {
                /**
                 * ignore if argument is not required
                 */
                if (typeof arg === 'undefined' && !commandParam.required) {
                    continue
                }

                const actual = commandParam.type.endsWith('[]')
                    ? `(${(Array.isArray(arg) ? arg : [arg]).map((a) => getArgumentType(a))})[]`
                    : getArgumentType(arg)
                throw new Error(
                    `Malformed type for "${commandParam.name}" parameter of command ${command}\n` +
                    `Expected: ${commandParam.type}\n` +
                    `Actual: ${actual}` +
                    moreInfo
                )
            }

            /**
             * inject url variables
             */
            if (i < variables.length) {
                const encodedArg = doubleEncodeVariables ? encodeURIComponent(encodeURIComponent(arg)) : encodeURIComponent(arg)
                endpoint = endpoint.replace(`:${commandParams[i].name}`, encodedArg)
                continue
            }

            /**
             * rest of args are part of body payload
             */
            body[commandParams[i].name] = arg
        }

        /**
         * Handle Bidi calls
         */
        if (isBidiCommand) {
            log.info('BIDI COMMAND', commandCallStructure(command, args, true))
            return this.eventMiddleware[command as typeof BIDI_COMMANDS[number]](args[0]) as any
        }

        const request = await RequestFactory.getInstance(method, endpoint, body, isHubCommand)
        request.on('performance', (...args) => this.emit('request.performance', ...args))
        this.emit('command', { method, endpoint, body })
        log.info('COMMAND', commandCallStructure(command, args))
        return request.makeRequest(this.options, this.sessionId).then((result) => {
            if (typeof result.value !== 'undefined') {
                let resultLog = result.value

                if (/screenshot|recording/i.test(command) && typeof result.value === 'string' && result.value.length > 64) {
                    resultLog = `${result.value.slice(0, 61)}...`
                } else if (command === 'executeScript' && body.script && body.script.includes('(() => window.__wdioEvents__)')) {
                    resultLog = `[${result.value.length} framework events captured]`
                }

                log.info('RESULT', resultLog)
            }

            this.emit('result', { method, endpoint, body, result })

            if (command === 'deleteSession') {
                /**
                 * kill driver process if there is one
                 */
                if (this._driverProcess && body.deleteSessionOpts?.shutdownDriver !== false) {
                    log.info(`Kill ${this._driverProcess.spawnfile} driver process with command line: ${this._driverProcess.spawnargs.slice(1).join(' ')}`)
                    const killedSuccessfully = this._driverProcess.kill('SIGKILL')
                    if (!killedSuccessfully) {
                        log.warn('Failed to kill driver process, manully clean-up might be required')
                    }
                    this._driverProcess = undefined

                    setTimeout(() => {
                        /**
                         * clear up potential leaked TLS Socket handles
                         * see https://github.com/puppeteer/puppeteer/pull/10667
                         */
                        for (const handle of process._getActiveHandles()) {
                            if (handle.servername && handle.servername.includes('edgedl.me')) {
                                handle.destroy()
                            }
                        }
                    }, 10)
                }

                /**
                 * clear logger stream if session has been terminated
                 */
                if (!process.env.WDIO_WORKER_ID) {
                    logger.clearLogger()
                }
            }
            return result.value
        })
    }
}
