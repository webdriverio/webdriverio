import logger from '@wdio/logger'
import { commandCallStructure, isValidParameter, getArgumentType } from '@wdio/utils'
import type { CommandEndpoint } from '@wdio/protocols'

import RequestFactory from './request/factory.js'
import { WebDriverResponse } from './request'
import type { BaseClient } from './types'

const log = logger('webdriver')

export default function (
    method: string,
    endpointUri: string,
    commandInfo: CommandEndpoint,
    doubleEncodeVariables = false
) {
    const { command, ref, parameters, variables = [], isHubCommand = false } = commandInfo

    return function protocolCommand (this: BaseClient, ...args: any[]): Promise<WebDriverResponse> {
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

        const request = RequestFactory.getInstance(method, endpoint, body, isHubCommand)
        request.on('performance', (...args) => this.emit('request.performance', ...args))
        this.emit('command', { method, endpoint, body })
        log.info('COMMAND', commandCallStructure(command, args))
        return request.makeRequest(this.options, this.sessionId).then((result) => {
            if (result.value != null) {
                log.info('RESULT', /screenshot|recording/i.test(command)
                    && typeof result.value === 'string' && result.value.length > 64
                    ? `${result.value.substr(0, 61)}...` : result.value)
            }

            this.emit('result', { method, endpoint, body, result })

            if (command === 'deleteSession') {
                logger.clearLogger()
            }
            return result.value
        })
    }
}
