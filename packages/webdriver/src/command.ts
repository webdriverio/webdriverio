import logger from '@wdio/logger'
import { commandCallStructure, isValidParameter, getArgumentType } from '@wdio/utils'
import {
    WebDriverBidiProtocol,
    type CommandEndpoint,
} from '@wdio/protocols'

import RequestFactory from './request/factory.js'
import type { WebDriverResponse } from './request/index.js'
import type { BaseClient, BidiCommands, BidiResponses } from './types.js'

const log = logger('webdriver')
const BIDI_COMMANDS: BidiCommands[] = Object.values(WebDriverBidiProtocol).map((def) => def.socket.command)

export default function (
    method: string,
    endpointUri: string,
    commandInfo: CommandEndpoint,
    doubleEncodeVariables = false
) {
    const { command, deprecated, ref, parameters, variables = [], isHubCommand = false } = commandInfo

    return async function protocolCommand (this: BaseClient, ...args: any[]): Promise<WebDriverResponse | BidiResponses | void> {
        const isBidiCommand = BIDI_COMMANDS.includes(command as BidiCommands)
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
         * log deprecation warning if command is deprecated
         */
        if (typeof deprecated === 'string') {
            log.warn(deprecated.replace('This command', `The "${command}" command`))
        }

        /**
         * Throw this error message for all WebDriver Bidi commands.
         * In case a successful connection to the browser bidi interface was established,
         * we attach a custom Bidi prototype to the browser instance.
         */
        if (isBidiCommand) {
            throw new Error(
                `Failed to execute WebDriver Bidi command "${command}" as no Bidi session ` +
                'was established. Make sure you enable it by setting "webSocketUrl: true" ' +
                'in your capabilities and verify that your environment and browser supports it.'
            )
        }

        /**
         * parameter check
         */
        const minAllowedParams = commandParams.filter((param) => param.required).length
        if (args.length < minAllowedParams || args.length > commandParams.length) {
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

        const request = await RequestFactory.getInstance(method, endpoint, body, isHubCommand)
        request.on('performance', (...args) => this.emit('request.performance', ...args))
        this.emit('command', { command, method, endpoint, body })
        log.info('COMMAND', commandCallStructure(command, args))
        /**
         * use then here so we can better unit test what happens before and after the request
         */
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

            this.emit('result', { command, method, endpoint, body, result })

            if (command === 'deleteSession') {
                const shutdownDriver = body.deleteSessionOpts?.shutdownDriver !== false
                /**
                 * kill driver process if there is one
                 */
                if (shutdownDriver && 'wdio:driverPID' in this.capabilities && this.capabilities['wdio:driverPID']) {
                    log.info(`Kill driver process with PID ${this.capabilities['wdio:driverPID']}`)
                    const killedSuccessfully = process.kill(this.capabilities['wdio:driverPID'], 'SIGKILL')
                    if (!killedSuccessfully) {
                        log.warn('Failed to kill driver process, manually clean-up might be required')
                    }

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
