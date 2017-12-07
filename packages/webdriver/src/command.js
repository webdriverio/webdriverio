import logger from 'wdio-logger'
import WebDriverRequest from './request'

const log = logger('webdriver')

export default function (method, endpoint, commandInfo) {
    const { command, ref, parameters, variables = [] } = commandInfo

    return function (...args) {
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
        if (args.length !== commandParams.length) {
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
            if (!(typeof arg).match(commandParams[i].type)) {
                throw new Error(
                    `Malformed type for "${commandParams[i].name}" parameter of command ${command}\n` +
                    `Expected: ${commandParams[i].type}\n` +
                    `Actual: ${typeof arg}` +
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
        return request.makeRequest(this.options, this.sessionId).then((result) => {
            if (result.value) {
                log.info('RESULT', result.value)
            }

            return result.value
        })
    }
}
