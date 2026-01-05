export type AppiumServerArguments = {
    /**
     * Hostname to listen on
     */
    address?: string
    /**
     * Allow web browser connections from any host
     */
    allowCors?: boolean
    /**
     * Comma-separated list of insecure features which are allowed to run in server session
     */
    allowInsecure?: string
    /**
     * Base path to use as the prefix for all webdriver routes running on the server
     */
    basePath?: string
    /**
     * Callback IP address
     */
    callbackAddress?: string
    /**
     * Callback Port
     */
    callbackPort?: number | string
    /**
     * Add exaggerated spacing in logs
     */
    debugLogSpacing?: boolean
    /**
     * Default desired capabilities, which will be added to each session unless overridden by received capabilities
     */
    defaultCapabilities?: object
    /**
     * Comma-separated list of insecure features which are not allowed to run in server session
     */
    denyInsecure?: string
    /**
     * Number of seconds the server applies as both the keep-alive timeout and the connection timeout for all requests
     */
    keepAliveTimeout?: number | string
    /**
     * Use local timezone for timestamps
     */
    localTimezone?: boolean
    /**
     * Send log output to the file
     */
    log?: string
    /**
     * Log Filters
     * A path to a valid JSON file containing an array of filtering rules
     */
    logFilters?: string
    /**
     * Log level
     */
    logLevel?: string
    /**
     * Use color in console output
     */
    logNoColors?: boolean
    /**
     * Show timestamps in console output
     */
    logTimestamp?: boolean
    /**
     * Add long stack traces to log entries
     */
    longStacktrace?: boolean
    /**
     * Do not check that needed files are readable and/or writable
     */
    noPermsCheck?: boolean
    /**
     * Path to configuration JSON file or the configuration itself
     */
    nodeconfig?: string | object
    /**
     * Port to listen on
     */
    port?: number | string
    /**
     * Disable additional security checks
     */
    relaxedSecurity?: boolean
    /**
     * Enables session override (clobbering)
     */
    sessionOverride?: boolean
    /**
     * Trigger session failures when provided desired capabilities are not recognized as valid
     */
    strictCaps?: boolean
    /**
     * Absolute path to directory used for managing temporary files
     */
    tmp?: string
    /**
     * Absolute path to directory used to save iOS instrument traces
     */
    traceDir?: string
    /**
     * Comma-separated list of drivers to activate
     */
    useDrivers?: string
    /**
     * Comma-separated list of plugins to activate
     */
    usePlugins?: string
    /**
     * Directs the log output to the listener
     */
    webhook?: string
}

export interface AppiumSessionCapabilities  {
    /**
     * Default session parameters
     */
    port?: number
    protocol?: string
    hostname?: string
    path?: string
}

export interface AppiumServiceConfig {
    /**
     * Path where all logs from the Appium server should be stored.
     */
    logPath?: string
    /**
     * To use your own installation of Appium, e.g. globally installed, specify the command which should be started.
     * @default "node"
     */
    command?: string
    /**
     * Map of arguments for the Appium server, passed directly to `appium`.
     * @default {}
     */
    args?: AppiumServerArguments

    /**
     * Timeout in milliseconds for Appium to start successfully.
     * @default 30000
     */
    appiumStartTimeout?: number

    /**
     * Enable selector performance tracking to measure element finding times.
     * When enabled, tracks all element-finding commands and stores timing data in JSON format.
     * @default false
     */
    trackSelectorPerformance?: boolean | {
        /**
         * Enable selector performance tracking
         * @default false
         */
        enabled?: boolean
        /**
         * Use page source analysis for more accurate selector suggestions.
         * When enabled, analyzes the actual element from page source to find optimal selectors.
         * This provides better suggestions but has performance overhead.
         * @default true
         */
        usePageSource?: boolean
        /**
         * Replace XPath selectors with optimized alternatives automatically.
         * When enabled, tests optimized selectors and uses them if they work, falling back to original if not.
         * This adds overhead as it requires testing the optimized selector, but provides real performance improvements.
         * @default true
         */
        replaceWithOptimizedSelector?: boolean
        /**
         * Enable the MobileSelectorPerformanceReporter to automatically collect test context information.
         * This reporter is required for accurate test file, suite name, and test name tracking.
         * @default true
         */
        enableReporter?: boolean
        /**
         * Path where the JSON report file should be saved.
         * If not provided, falls back to config.outputDir, then appium service logPath.
         * If none are set, an error will be thrown.
         */
        reportPath?: string
        /**
         * Maximum line length for terminal report output.
         * Lines longer than this will be wrapped at word boundaries.
         * @default 100
         */
        maxLineLength?: number
    }
}

export type ArgValue = string | number | boolean | null | object
export type KeyValueArgs = { [key: string]: ArgValue }
