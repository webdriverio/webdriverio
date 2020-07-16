/**
 * Throttle the network capabilities of the browser. This can help to
 * emulate certain scenarios where a user looses the internet connection
 * and your app needs to address that.
 *
 * <example>
    :throttle.js
    it('should throttle the network', () => {
        // via static string
        browser.throttle('Regular 3G')

        // via custom values
        browser.throttle({
            'offline': false,
            'downloadThroughput': 200 * 1024 / 8,
            'uploadThroughput': 200 * 1024 / 8,
            'latency': 20
        })
    });
 * </example>
 *
 * @alias browser.throttle
 * @param {ThrottleOptions} params  parameters for throttling
 * @type utility
 *
 */
import { getBrowserObject, getPuppeteer } from '../../utils'

const NETWORK_PRESETS = {
    'offline': {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 1
    },
    'GPRS': {
        offline: false,
        downloadThroughput: 50 * 1024 / 8,
        uploadThroughput: 20 * 1024 / 8,
        latency: 500
    },
    'Regular2G': {
        offline: false,
        downloadThroughput: 250 * 1024 / 8,
        uploadThroughput: 50 * 1024 / 8,
        latency: 300
    },
    'Good2G': {
        offline: false,
        downloadThroughput: 450 * 1024 / 8,
        uploadThroughput: 150 * 1024 / 8,
        latency: 150
    },
    'Regular3G': {
        offline: false,
        downloadThroughput: 750 * 1024 / 8,
        uploadThroughput: 250 * 1024 / 8,
        latency: 100
    },
    'Good3G': {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8,
        uploadThroughput: 750 * 1024 / 8,
        latency: 40
    },
    'Regular4G': {
        offline: false,
        downloadThroughput: 4 * 1024 * 1024 / 8,
        uploadThroughput: 3 * 1024 * 1024 / 8,
        latency: 20
    },
    'DSL': {
        offline: false,
        downloadThroughput: 2 * 1024 * 1024 / 8,
        uploadThroughput: 1 * 1024 * 1024 / 8,
        latency: 5
    },
    'WiFi': {
        offline: false,
        downloadThroughput: 30 * 1024 * 1024 / 8,
        uploadThroughput: 15 * 1024 * 1024 / 8,
        latency: 2
    },
    'online': {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1
    }
}
const NETWORK_PRESET_TYPES = Object.keys(NETWORK_PRESETS)

export default async function throttle (params) {
    if (
        /**
         * check string parameter
         */
        (typeof params !== 'string' || !NETWORK_PRESET_TYPES.includes(params)) &&
        /**
         * check object parameter
         */
        (typeof params !== 'object')
    ) {
        throw new Error(`Invalid parameter for "throttle". Expected it to be typeof object or one of the following values: ${NETWORK_PRESET_TYPES.join(', ')} but found "${params}"`)
    }

    /**
     * use WebDriver extension if connected with cloud service
     */
    if (this.isSauce) {
        const browser = getBrowserObject(this)
        await browser.throttleNetwork(params)
        return null
    }

    // Connect to Chrome DevTools
    await getPuppeteer.call(this)
    const pages = await this.puppeteer.pages()
    const client = await pages[0].target().createCDPSession()

    // Set throttling property
    await client.send(
        'Network.emulateNetworkConditions',
        typeof params === 'string'
            ? NETWORK_PRESETS[params]
            : params
    )

    return null
}
