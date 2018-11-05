const DEFAULT_HOSTNAME = '127.0.0.1'
const DEFAULT_PORT = 4444

/**
 * helper to detect the Selenium backend according to given capabilities
 */
export function detectBackend (options = {}) {
    const { port, hostname, user, key } = options

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
            protocol: 'https',
            hostname: 'ondemand.saucelabs.com',
            port: 443
        }
    }

    /**
     * no cloud provider detected, fallback to local browser driver
     */
    return {
        hostname: hostname || DEFAULT_HOSTNAME,
        port: port || DEFAULT_PORT
    }
}

/**
 * initialise WebdriverIO compliant plugins
 */
export function initialisePlugin (name, type) {
    /**
     * don't populate scoped package names
     */
    const pkgName = name[0] === '@' ? name : `wdio-${name.toLowerCase()}-${type}`

    try {
        return require(pkgName)
    } catch (e) {
        if (!e.message.match(`Cannot find module '${pkgName}'`)) {
            throw new Error(`Couldn't initialise "${name}" ${type}.\n${e.stack}`)
        }

        throw new Error(
            `Couldn't find plugin "${pkgName}". You need to install it ` +
            `with \`$ npm install ${pkgName}\`!\n${e.stack}`
        )
    }
}
