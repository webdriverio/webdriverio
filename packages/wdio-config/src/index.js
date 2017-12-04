export default function validateConfig (defaults, options) {
    const params = {}

    for (const [name, expectedOption] of Object.entries(defaults)) {
        /**
         * check if options is given
         */
        if (typeof options[name] === 'undefined' && !expectedOption.default && expectedOption.required) {
            throw new Error(`Required option "${name}" is missing`)
        }

        if (typeof options[name] === 'undefined' && expectedOption.default) {
            params[name] = expectedOption.default
        }

        const isValidType = typeof expectedOption.type === 'string'
            ? typeof options[name] === expectedOption.type && (!expectedOption.match || options[name].match(expectedOption.match))
            : expectedOption.type(options[name])
        if (typeof options[name] !== 'undefined' && isValidType) {
            params[name] = options[name]
        }
    }

    return params
}
