import WebDriverRequest from './request'

export default function (method, endpoint, commandInfo) {
    const { command, ref, parameters } = commandInfo

    return function (...args) {
        const commandUsage = `${command}(${parameters.map((p) => p.name).join(', ')})`
        const moreInfo = `\n\nFor more info see ${ref}\n`
        const body = {}

        /**
         * parameter check
         */
        if (args.length !== parameters.length) {
            const parameterDescription = parameters.length
                ? `\n\nProperty Description:\n${parameters.map((p) => `  "${p.name}" (${p.type}): ${p.description}`).join('\n')}`
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
            if (!(typeof arg).match(parameters[i].type)) {
                throw new Error(
                    `Malformed type for "${parameters[i].name}" parameter of command ${command}\n` +
                    `Expected: ${parameters[i].type}\n` +
                    `Actual: ${typeof arg}` +
                    moreInfo
                )
            }

            body[parameters[i].name] = arg
        }

        const request = new WebDriverRequest(method, endpoint, body)
        return request.makeRequest(this.options, this.sessionId)
    }
}
