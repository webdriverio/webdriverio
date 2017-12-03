const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 4444

/**
 * helper to detect the Selenium backend according to given capabilities
 */
export default function detectBackend (options) {
    /**
     * don't detect anything if host or port is given
     */
    if (options.host && options.port) {
        return Object.assign(options, {
            host: options.host,
            port: options.port
        })
    }

    /**
     * local Selenium server
     */
    if (!options.user && !options.key) {
        return Object.assign(options, {
            host: DEFAULT_HOST,
            port: DEFAULT_PORT
        })
    }

    /**
     * browserstack
     * e.g. zHcv9sZ39ip8ZPsxBVJ2
     */
    if (options.key.length === 20) {
        return Object.assign(options, {
            host: 'hub.browserstack.com',
            port: 80
        })
    }

    /**
     * testingbot
     * e.g. ec337d7b677720a4dde7bd72be0bfc67
     */
    if (options.key.length === 32) {
        return Object.assign(options, {
            host: 'hub.testingbot.com',
            port: 80
        })
    }

    /**
     * Sauce Labs
     * e.g. 50aa152c-1932-B2f0-9707-18z46q2n1mb0
     */
    return Object.assign(options, {
        protocol: 'https',
        host: 'ondemand.saucelabs.com',
        port: 443
    })
}
