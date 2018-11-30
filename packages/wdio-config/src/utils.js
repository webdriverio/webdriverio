const DEFAULT_HOSTNAME = '127.0.0.1'
const DEFAULT_PORT = 4444
const DEFAULT_PROTOCOL = 'http'

const REGION_MAPPING = {
    'eu': 'eu-central-1'
}

export function getSauceEndpoint (region) {
    const dc = region ? (REGION_MAPPING[region] || region) + '.' : ''
    return `${dc}saucelabs.com`
}

/**
 * helper to detect the Selenium backend according to given capabilities
 */
export function detectBackend (options = {}) {
    const { port, hostname, user, key, protocol, region } = options

    /**
     * browserstack
     * e.g. zHcv9sZ39ip8ZPsxBVJ2
     */
    if (typeof user === 'string' && key.length === 20) {
        return {
            hostname: 'hub.browserstack.com',
            port: 80
        }
    }

    /**
     * testingbot
     * e.g. ec337d7b677720a4dde7bd72be0bfc67
     */
    if (typeof user === 'string' && key.length === 32) {
        return {
            hostname: 'hub.testingbot.com',
            port: 80
        }
    }

    /**
     * Sauce Labs
     * e.g. 50aa152c-1932-B2f0-9707-18z46q2n1mb0
     */
    if (typeof user === 'string' && key.length === 36) {
        return {
            protocol: protocol || 'https',
            hostname: hostname || `ondemand.${getSauceEndpoint(region)}`,
            port: port || 443
        }
    }

    /**
     * no cloud provider detected, fallback to local browser driver
     */
    return {
        hostname: hostname || DEFAULT_HOSTNAME,
        port: port || DEFAULT_PORT,
        protocol: protocol || DEFAULT_PROTOCOL
    }
}

/**
 * Allows to safely require a package, it only throws if the package was found
 * but failed to load due to syntax errors
 * @param  {string} name  of package
 * @return {object}       package content
 */
function safeRequire (name) {
    try {
        return require(name)
    } catch (e) {
        if (!e.message.match(`Cannot find module '${name}'`)) {
            throw new Error(`Couldn't initialise "${name}".\n${e.stack}`)
        }

        return null
    }
}

/**
 * initialise WebdriverIO compliant plugins like reporter or services in the following way:
 * 1. if package name is scoped (starts with "@"), require scoped package name
 * 2. otherwise try to require "@wdio/<name>-<type>"
 * 3. otherwise try to require "wdio-<name>-<type>"
 */
export function initialisePlugin (name, type, target = 'default') {
    /**
     * directly import packages that are scoped
     */
    if (name[0] === '@') {
        const service = safeRequire(name)
        return service[target]
    }

    /**
     * check for scoped version of plugin first (e.g. @wdio/sauce-service)
     */
    const scopedPlugin = safeRequire(`@wdio/${name.toLowerCase()}-${type}`)
    if (scopedPlugin) {
        return scopedPlugin[target]
    }

    /**
     * check for old type of
     */
    const plugin = safeRequire(`wdio-${name.toLowerCase()}-${type}`)
    if (plugin) {
        return plugin[target]
    }

    throw new Error(
        `Couldn't find plugin "${name}" ${type}, neither as wdio scoped package `+
        `"@wdio/${name.toLowerCase()}-${type}" nor as community package ` +
        `"wdio-${name.toLowerCase()}-${type}". Please make sure you have it installed!`
    )
}


/**
 * validates configurations based on default values
 * @param  {Object} defaults  object describing all allowed properties
 * @param  {Object} options   option to check agains
 * @return {Object}           validated config enriched with default values
 */
export function validateConfig (defaults, options) {
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

            if (typeof expectedOption.type === 'function') {
                try {
                    expectedOption.type(options[name])
                } catch (e) {
                    throw new Error(`Type check for option "${name}" failed: ${e.message}`)
                }
            }

            if (expectedOption.match && !options[name].match(expectedOption.match)) {
                throw new Error(`Option "${name}" doesn't match expected values: ${expectedOption.match}`)
            }

            params[name] = options[name]
        }
    }

    return params
}
