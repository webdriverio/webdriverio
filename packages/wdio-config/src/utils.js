const DEFAULT_HOSTNAME = '127.0.0.1'
const DEFAULT_PORT = 4444
const DEFAULT_PROTOCOL = 'http'
const DEFAULT_PATH = '/'
const LEGACY_PATH = '/wd/hub'

const REGION_MAPPING = {
    'us': 'us-west-1.', // default endpoint
    'eu': 'eu-central-1.',
    'eu-central-1': 'eu-central-1.',
    'us-east-1': 'us-east-1.'
}

export const validObjectOrArray = (object) => (Array.isArray(object) && object.length > 0) ||
    (typeof object === 'object' && Object.keys(object).length > 0)

export function getSauceEndpoint (region, isRDC) {
    const shortRegion = REGION_MAPPING[region] ? region : 'us'
    if (isRDC){
        return `${shortRegion}1.appium.testobject.com`
    }

    return `ondemand.${REGION_MAPPING[shortRegion]}saucelabs.com`
}

/**
 * remove line numbers from file path, ex:
 * `/foo:9` or `c:\bar:14:5`
 * @param   {string} filePath path to spec file
 * @returns {string}
 */
export function removeLineNumbers(filePath) {
    const matcher = filePath.match(/:\d+(:\d+$|$)/)
    if (matcher) {
        filePath = filePath.substring(0, matcher.index)
    }
    return filePath
}

/**
 * does spec file path contain Cucumber's line number, ex
 * `/foo/bar:9` or `c:\bar\foo:14:5`
 * @param {string|string[]} spec
 */
export function isCucumberFeatureWithLineNumber(spec) {
    const specs = Array.isArray(spec) ? spec : [spec]
    return specs.some((s) => s.match(/:\d+(:\d+$|$)/))
}

export function isCloudCapability(cap) {
    return Boolean(cap && (cap['bstack:options'] || cap['sauce:options'] || cap['tb:options']))
}

/**
 * helper to detect the Selenium backend according to given capabilities
 */
export function detectBackend (options = {}, isRDC = false) {
    let { port, hostname, user, key, protocol, region, headless, path } = options

    /**
     * browserstack
     * e.g. zHcv9sZ39ip8ZPsxBVJ2
     */
    if (typeof user === 'string' && typeof key === 'string' && key.length === 20) {
        return {
            protocol: protocol || 'https',
            hostname: hostname || 'hub-cloud.browserstack.com',
            port: port || 443,
            path: path || LEGACY_PATH
        }
    }

    /**
     * testingbot
     * e.g. ec337d7b677720a4dde7bd72be0bfc67
     */
    if (typeof user === 'string' && typeof key === 'string' && key.length === 32) {
        return {
            protocol: protocol || 'https',
            hostname: hostname || 'hub.testingbot.com',
            port: port || 443,
            path: path || LEGACY_PATH
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
            port: port || 443,
            path: path || LEGACY_PATH
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
            'known cloud service (Sauce Labs, Browerstack or Testingbot). ' +
            'Please check if given user and key properties are correct!'
        )
    }

    /**
     * default values if on of the WebDriver criticial options is set
     */
    if (hostname || port || protocol || path) {
        return {
            hostname: hostname || DEFAULT_HOSTNAME,
            port: port || DEFAULT_PORT,
            protocol: protocol || DEFAULT_PROTOCOL,
            path: path || DEFAULT_PATH
        }
    }

    /**
     * no cloud provider detected, pass on provided params and eventually
     * fallback to DevTools protocol
     */
    return { hostname, port, protocol, path }
}

/**
 * validates configurations based on default values
 * @param  {Object} defaults  object describing all allowed properties
 * @param  {Object} options   option to check against
 * @return {Object}           validated config enriched with default values
 */
export function validateConfig (defaults, options, keysToKeep = []) {
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
            if (typeof options[name] !== expectedOption.type) {
                throw new Error(`Expected option "${name}" to be type of ${expectedOption.type} but was ${typeof options[name]}`)
            }

            if (typeof expectedOption.validate === 'function') {
                try {
                    expectedOption.validate(options[name])
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

    for (const [name, option] of Object.entries(options)) {
        /**
         * keep keys from source object if desired
         */
        if (keysToKeep.includes(name)) {
            params[name] = option
        }
    }

    return params
}
