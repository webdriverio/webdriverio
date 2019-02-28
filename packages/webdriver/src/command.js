import logger from '@wdio/logger'
import WebDriverRequest from './request'
import { isValidParameter, getArgumentType, commandCallStructure } from './utils'

const log = logger('webdriver')

export default function (method, endpointUri, commandInfo) {
    const { command, ref, parameters, variables = [] } = commandInfo

    return function (...args) {
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
        const body = {}

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
        for (const [i, arg] of Object.entries(args)) {
            const commandParam = commandParams[i]

            if (!isValidParameter(arg, commandParam.type)) {
                /**
                 * ignore if argument is not required
                 */
                if (typeof arg === 'undefined' && !commandParam.required) {
                    continue
                }

                throw new Error(
                    `Malformed type for "${commandParam.name}" parameter of command ${command}\n` +
                    `Expected: ${commandParam.type}\n` +
                    `Actual: ${getArgumentType(arg)}` +
                    moreInfo
                )
            }

            /**
             * inject url variables
             */
            if (i < variables.length) {
                endpoint = endpoint.replace(`:${commandParams[i].name}`, arg)
                continue
            }

            /**
             * rest of args are part of body payload
             */
            body[commandParams[i].name] = arg
        }

        const request = new WebDriverRequest(method, endpoint, body)
        this.emit('command', { method, endpoint, body })
        log.info('COMMAND', commandCallStructure(command, args))
        return request.makeRequest(this.options, this.sessionId).then((result) => {
            if (result.value != null) {
                log.info('RESULT', command.toLowerCase().includes('screenshot')
                    && typeof result.value === 'string' && result.value.length > 64
                    ? `${result.value.substr(0, 61)}...` : result.value)
            }

            this.emit('result', { method, endpoint, body, result })
            return result.value
        })
    }
}
