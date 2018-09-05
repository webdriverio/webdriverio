import { Writable } from 'stream'

const DEFAULTS = {
    /**
     * protocol of automation driver
     */
    protocol: {
        type: 'string',
        default: 'http',
        match: /(http|https)/
    },
    /**
     * hostname of automation driver
     */
    hostname: {
        type: 'string',
        default: '0.0.0.0'
    },
    /**
     * port of automation driver
     */
    port: {
        type: 'number',
        default: 4444
    },
    /**
     * path to WebDriver endpoints
     */
    path: {
        type: 'string',
        default: '/wd/hub'
    },
    /**
     * A key-value store of query parameters to be added to every selenium request
     */
    queryParams: {
        type: 'object'
    },
    /**
     * capability of WebDriver session
     */
    capabilities: {
        type: 'object',
        required: true
    },
    /**
     * Level of logging verbosity
     */
    logLevel: {
        type: 'string',
        default: 'silent',
        match: /(trace|debug|info|warn|error)/
    },
    /**
     * logOutput as file path or writeable stream
     */
    logOutput: {
        type: (param) => {
            if (typeof param === 'string' || param instanceof Writable) {
                return
            }

            throw new Error(`logOutput needs to be a string or a writeable stream`)
        }
    },
    /**
     * Timeout for any request to the Selenium server
     */
    connectionRetryTimeout: {
        type: 'number',
        default: 90000
    },
    /**
     * Count of request retries to the Selenium server
     */
    connectionRetryCount: {
        type: 'number',
        default: 2
    },
    /**
     * cloud user if applicable
     */
    user: {
        type: 'string'
    },
    /**
     * access key to user
     */
    key: {
        type: 'string'
    }
}

export { DEFAULTS }
