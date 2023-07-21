import type { Options } from '@wdio/types'

export const DEFAULTS: Options.Definition<Required<Options.WebDriver>> = {
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
        type: 'string',
        validate: (path: string): boolean => {
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
     * directory for log files
     */
    outputDir: {
        type: 'string'
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
     * Override default agent
     */
    agent: {
        type: 'object'
    },
    /**
     * Override default agent
     */
    logLevels: {
        type: 'object'
    },
    /**
     * Pass custom headers
     */
    headers: {
        type: 'object'
    },
    /**
     * Function transforming the request options before the request is made
     */
    transformRequest: {
        type: 'function',
        default: (requestOptions: Options.RequestLibOptions) => requestOptions
    },
    /**
     * Function transforming the response object after it is received
     */
    transformResponse: {
        type: 'function',
        default: (response: Options.RequestLibResponse) => response
    },
    /**
     * Appium direct connect options server (https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments)
     * Whether to allow direct connect caps to adjust endpoint details (Appium only)
     */
    enableDirectConnect: {
        type: 'boolean',
        default: true
    },
    /**
     * Whether it requires SSL certificates to be valid in HTTP/s requests
     * for an environment which cannot get process environment well.
     */
    strictSSL: {
        type: 'boolean',
        default: true
    }
}

export const REG_EXPS = {
    commandName: /.*\/session\/[0-9a-f-]+\/(.*)/,
    execFn: /return \(([\s\S]*)\)\.apply\(null, arguments\)/
}
