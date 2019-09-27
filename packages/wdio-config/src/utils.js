const DEFAULT_HOSTNAME = '127.0.0.1'
const DEFAULT_PORT = 4444
const DEFAULT_PROTOCOL = 'http'

const REGION_MAPPING = {
    'us': '', // default endpoint
    'eu': 'eu-central-1.',
    'eu-central-1': 'eu-central-1.',
    'us-east-1': 'us-east-1.'
}

export function getSauceEndpoint (region, isRDC) {
    const shortRegion = REGION_MAPPING[region] ? region : 'us'
    if (isRDC){
        return `${shortRegion}1.appium.testobject.com`
    }

    return `ondemand.${REGION_MAPPING[shortRegion]}saucelabs.com`
}

/**
 * helper to detect the Selenium backend according to given capabilities
 */
export function detectBackend (options = {}, isRDC = false) {
    let { port, hostname, user, key, protocol, region, headless } = options

    /**
     * browserstack
     * e.g. zHcv9sZ39ip8ZPsxBVJ2
     */
    if (typeof user === 'string' && typeof key === 'string' && key.length === 20) {
        return {
            protocol: 'https',
            hostname: 'hub-cloud.browserstack.com',
            port: 443
        }
    }

    /**
     * testingbot
     * e.g. ec337d7b677720a4dde7bd72be0bfc67
     */
    if (typeof user === 'string' && typeof key === 'string' && key.length === 32) {
        return {
            hostname: 'hub.testingbot.com',
            port: 80
        }
    }

    /**
     * Sauce Labs
     * e.g. 50aa152c-1932-B2f0-9707-18z46q2n1mb0
     */
    if ((typeof user === 'string' && typeof key === 'string' && key.length === 36) ||
        // When SC is used a user needs to be provided and `isRDC` needs to be true
        (typeof user === 'string' && isRDC) ||
        // Or only RDC
        isRDC
    ) {
        // Sauce headless is currently only in us-east-1
        const sauceRegion = headless ? 'us-east-1' : region

        return {
            protocol: protocol || 'https',
            hostname: hostname || getSauceEndpoint(sauceRegion, isRDC),
            port: port || 443
        }
    }

    if (
        /**
         * user and key are set in config
         */
        (typeof user === 'string' || typeof key === 'string') &&
        /**
         * but no custom WebDriver endpoint was configured
         */
        !hostname
    ) {
        throw new Error(
            'A "user" or "key" was provided but could not be connected to a ' +
            'known cloud service (SauceLabs, Browerstack or Testingbot). ' +
            'Please check if given user and key properties are correct!'
        )
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
