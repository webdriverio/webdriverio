import type { Capabilities, Options } from '@wdio/types'

const DEFAULT_HOSTNAME = '127.0.0.1'
const DEFAULT_PORT = 4444
const DEFAULT_PROTOCOL = 'http'
const DEFAULT_PATH = '/'
const LEGACY_PATH = '/wd/hub'

const REGION_MAPPING = {
    'us': 'us-west-1.', // default endpoint
    'eu': 'eu-central-1.',
    'eu-central-1': 'eu-central-1.',
    'us-east-1': 'us-east-1.',
    'apac': 'apac-southeast-1.',
    'apac-southeast-1': 'apac-southeast-1',
}

interface BackendConfigurations {
    port?: number
    hostname?: string
    user?: string
    key?: string
    protocol?: string
    region?: Options.SauceRegions
    headless?: boolean
    path?: string
    capabilities?: Capabilities.RemoteCapabilities | Capabilities.RemoteCapability
}

function getSauceEndpoint (
    region: keyof typeof REGION_MAPPING,
    { isRDC, isVisual }: { isRDC?: boolean, isVisual?: boolean } = {}
) {
    const shortRegion = REGION_MAPPING[region] ? region : 'us'
    if (isRDC) {
        return `${shortRegion}1.appium.testobject.com`
    } else if (isVisual) {
        return 'hub.screener.io'
    }

    return `ondemand.${REGION_MAPPING[shortRegion]}saucelabs.com`
}

/**
 * helper to detect the Selenium backend according to given capabilities
 */
export default function detectBackend(options: BackendConfigurations = {}) {
    const { port, hostname, user, key, protocol, region, headless, path, capabilities } = options

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
     *
     * For Sauce Labs Legacy RDC we only need to determine if the sauce option has a `testobject_api_key`.
     * Same for Sauce Visual where an apiKey can be passed in through the capabilities (soon to be legacy too).
     */
    const isRDC = Boolean(!Array.isArray(capabilities) && (capabilities as WebDriver.DesiredCapabilities)?.testobject_api_key)
    const isVisual = Boolean(!Array.isArray(capabilities) && capabilities && (capabilities as WebDriver.DesiredCapabilities)['sauce:visual']?.apiKey)
    if ((typeof user === 'string' && typeof key === 'string' && key.length === 36) ||
        // Or only RDC or visual
        (isRDC || isVisual)
    ) {
        // Sauce headless is currently only in us-east-1
        const sauceRegion = headless ? 'us-east-1' : region as keyof typeof REGION_MAPPING

        return {
            protocol: protocol || 'https',
            hostname: hostname || getSauceEndpoint(sauceRegion, { isRDC, isVisual }),
            port: port || 443,
            path: path || LEGACY_PATH
        }
    }

    /**
     * Lambdatest
     * e.g. cYAjKrqGwyPjPQv41ICDF4C5OjlxzA9epZsnugVJJxqOReWRWU
     */
    if (typeof user === 'string' && typeof key === 'string' && key.length === 50) {
        return {
            protocol: protocol || DEFAULT_PROTOCOL,
            hostname: hostname || 'hub.lambdatest.com',
            port: port || 80,
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
            'known cloud service (Sauce Labs, Browerstack, Testingbot or Lambdatest). ' +
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
