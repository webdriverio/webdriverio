export const DEFAULTS = {
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
        default: 'localhost'
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
        type: (path) => {
            if (typeof path !== 'string') {
                throw new TypeError('The option "path" needs to be from type "string"')
            }

            if (!path.startsWith('/')) {
                throw new TypeError('The option "path" needs to start with a "/"')
            }

            return true
        },
        default: '/'
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
        default: 'info',
        match: /(trace|debug|info|warn|error|silent)/
    },
    /**
     * Timeout for any WebDriver request to a driver or grid
     */
    connectionRetryTimeout: {
        type: 'number',
        default: 120000
    },
    /**
     * Count of request retries to the Selenium server
     */
    connectionRetryCount: {
        type: 'number',
        default: 3
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
    },
    /**
     * Override default agent
     */
    agent: {
        type: 'object'
    },
    /**
     * Pass custom headers
     */
    headers: {
        type: 'object'
    },
    /**
     * Whether to allow direct connect caps to adjust endpoint details (Appium only)
     */
    enableDirectConnect: {
        type: 'boolean',
        default: false
    },
    /**
     * Function transforming the request options before the request is made
     */
    transformRequest: requestOptions => requestOptions,
    /**
     * Function transforming the response object after it is received
     */
    transformResponse: response => response,
}
