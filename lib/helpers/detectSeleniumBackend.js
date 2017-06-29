const DEFAULT_HOST = '127.0.0.1'
const DEFAULT_PORT = 4444

/**
 * helper to detect the Selenium backend according to given capabilities
 */
let detectSeleniumBackend = function (capabilities) {
    /**
     * don't detect anything if host or port is given
     */
    if (capabilities.host || capabilities.port) {
        return {
            host: capabilities.host || DEFAULT_HOST,
            port: capabilities.port || DEFAULT_PORT
        }
    }

    /**
     * local Selenium server
     */
    if (!capabilities.user || !capabilities.key) {
        return {
            host: DEFAULT_HOST,
            port: DEFAULT_PORT
        }
    }

    /**
     * browserstack
     * e.g. zHcv9sZ39ip8ZPsxBVJ2
     */
    if (capabilities.key.length === 20) {
        return {
            host: 'hub.browserstack.com',
            port: 80
        }
    }

    /**
     * testingbot
     * e.g. ec337d7b677720a4dde7bd72be0bfc67
     */
    if (capabilities.key.length === 32) {
        return {
            host: 'hub.testingbot.com',
            port: 80
        }
    }

    /**
     * Sauce Labs
     * e.g. 50aa152c-1932-B2f0-9707-18z46q2n1mb0
     */
    return {
        protocol: 'https',
        host: 'ondemand.saucelabs.com',
        port: 443
    }
}

export default detectSeleniumBackend
