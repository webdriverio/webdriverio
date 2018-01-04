import detectBackend from './detectBackend'

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

        if (typeof options[name] !== 'undefined') {
            if (typeof expectedOption.type === 'string' && typeof options[name] !== expectedOption.type) {
                throw new Error(`Expected option "${name}" to be type of ${expectedOption.type} but was ${typeof options[name]}`)
            }

            if (typeof expectedOption.type === 'function' && !expectedOption.type(options[name])) {
                throw new Error(`Option "${name}" failed type check ${expectedOption.type}`)
            }

            if (expectedOption.match && !options[name].match(expectedOption.match)) {
                throw new Error(`Option "${name}" doesn't match expected values: ${expectedOption.match}`)
            }

            params[name] = options[name]
        }
    }

    return params
}

export { validateConfig, detectBackend }
