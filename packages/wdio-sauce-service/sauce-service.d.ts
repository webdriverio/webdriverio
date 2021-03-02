declare module WebdriverIO {
    interface ServiceOption extends SauceServiceConfig {}
}

interface SauceConnectOpts {
	/**
	 * Sauce Labs username. You can also pass this through the
	 * SAUCE_USERNAME environment variable
	 */
	username?: string;

	/**
	 * Sauce Labs access key.  You can also pass this through the
	 * SAUCE_ACCESS_KEY environment variable
	 */
	accessKey?: string;

	/**
	 * Log output from the `sc` process to stdout
	 */
	verbose?: boolean;

	/**
	 * Enable verbose debugging (optional)
	 */
	verboseDebugging?: boolean;

	/**
	 * Together with verbose debugging will output HTTP headers as well (optional)
	 */
	vv?: boolean;

	/**
	 * Port on which Sauce Connect's Selenium relay will listen for requests. Default 4445. (optional)
	 */
	port?: number;

	/**
	 * Proxy host and port that Sauce Connect should use to connect to the Sauce Labs cloud.
	 * e.g. "localhost?:1234" (optional)
	 */
	proxy?: string;

	/**
	 * Change sauce connect logfile location (optional)
	 */
	logfile?: string;

	/**
	 * Period to log statistics about HTTP traffic in seconds (optional)
	 */
	logStats?: number;

	/**
	 * Maximum size before which the logfile is rotated (optional)
	 */
	maxLogsize?: number;

	/**
	 * Set to true to perform checks to detect possible misconfiguration or problems (optional)
	 */
	doctor?: boolean;

	/**
	 * Identity the tunnel for concurrent tunnels (optional)
	 */
	tunnelIdentifier?: string;

	/**
	 * An array or comma-separated list of regexes whose matches will not go through the tunnel. (optional)
	 */
	fastFailRegexps?: string[];

	/**
	 * An array or comma-separated list of domains that will not go through the tunnel. (optional)
	 */
	directDomains?: string[];

	/**
	 * A function to optionally write sauce-connect-launcher log messages. e.g. `console.log`.  (optional)
	 */
	logger?(): any;

	/**
	 * An optional suffix to be appended to the `readyFile` name. useful when running multiple tunnels on the same
	 * machine such as in a continuous integration environment. (optional)
	 */
	readyFileId?: string;

	/**
	 * Retry to establish a tunnel multiple times. (optional)
	 */
	connectRetries?: number;

	/**
	 * Time to wait between connection retries in ms. (optional)
	 */
	connectRetryTimeout?: number;

	/**
	 * Retry to download the sauce connect archive multiple times. (optional)
	 */
	downloadRetries?: number;

	/**
	 * Time to wait between download retries in ms. (optional)
	 */
	downloadRetryTimeout?: number;

	/**
	 * Path to a sauce connect executable (optional) by default the latest sauce connect version is downloaded
	 */
	exe?: string;

	/**
	 * Keep sc running after the node process exited this means you need to close the process manually once you are
	 * done using the pidfile
	 * Attention?: This only works with sc versions <= 4.3.16 and only on macOS and linux at the moment
	 */
	detached?: boolean;

	/**
	 * Specify a connect version instead of fetching the latest version, this currently does not support
	 * checksum verification
	 */
	connectVersion?: string;
}

interface SauceServiceConfig {
    /**
     * If true it runs Sauce Connect and opens a secure connection between a Sauce Labs virtual
     * machine running your browser tests.
     */
    sauceConnect?: boolean;
    /**
     * Apply Sauce Connect options (e.g. to change port number or logFile settings). See this
     * list for more information: https://github.com/bermi/sauce-connect-launcher#advanced-usage
     */
    sauceConnectOpts?: SauceConnectOpts;
    /**
     * Use Sauce Connect as a Selenium Relay. See more [here](https://wiki.saucelabs.com/display/DOCS/Using+the+Selenium+Relay+with+Sauce+Connect+Proxy).
     * @deprecated
     */
    scRelay?: boolean;
}
