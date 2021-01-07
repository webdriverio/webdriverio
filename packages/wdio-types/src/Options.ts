import * as got from 'got'
import * as http from 'http'
import * as https from 'https'

import { W3CCapabilities, DesiredCapabilities } from './Capabilities'

export type WebDriverLogTypes = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface WebDriver {
    /**
     * Protocol to use when communicating with the Selenium standalone server (or driver).
     *
     * @default 'http'
     */
    protocol?: string;
    /**
     * Host of your WebDriver server.
     *
     * @default 'localhost'
     */
    hostname?: string;
    /**
     * Port your WebDriver server is on.
     *
     * @default 4444
     */
    port?: number;
    /**
     * Path to WebDriver endpoint or grid server.
     *
     * @default '/'
     */
    path?: string;
    /**
     * Query paramaters that are propagated to the driver server.
     */
    queryParams?: {
        [name: string]: string;
    },
    /**
     * Your cloud service username (only works for [Sauce Labs](https://saucelabs.com),
     * [Browserstack](https://www.browserstack.com), [TestingBot](https://testingbot.com),
     * [CrossBrowserTesting](https://crossbrowsertesting.com) or
     * [LambdaTest](https://www.lambdatest.com) accounts). If set, WebdriverIO will
     * automatically set connection options for you. If you don't use a cloud provider this
     * can be used to authenticate any other WebDriver backend.
     */
    user?: string
    /**
     * Your cloud service access key or secret key (only works for
     * [Sauce Labs](https://saucelabs.com), [Browserstack](https://www.browserstack.com),
     * [TestingBot](https://testingbot.com), [CrossBrowserTesting](https://crossbrowsertesting.com)
     * or [LambdaTest](https://www.lambdatest.com) accounts). If set, WebdriverIO will
     * automatically set connection options for you. If you don't use a cloud provider this
     * can be used to authenticate any other WebDriver backend.
     */
    key?: string
    /**
     * Defines the capabilities you want to run in your WebDriver session. Check out the
     * [WebDriver Protocol](https://w3c.github.io/webdriver/#capabilities) for more details.
     * If you want to run multiremote session you need to define an object that has the
     * browser instance names as string and their capabilities as values.
     *
     * @example
     * ```js
     * // WebDriver/DevTools session
     * const browser = remote({
     *   capabilities: {
     *     browserName: 'chrome',
     *     browserVersion: 86
     *     platformName: 'Windows 10'
     *   }
     * })
     *
     * // multiremote session
     * const browser = remote({
     *   capabilities: {
     *     browserA: {
     *       browserName: 'chrome',
     *       browserVersion: 86
     *       platformName: 'Windows 10'
     *     },
     *     browserB: {
     *       browserName: 'firefox',
     *       browserVersion: 74
     *       platformName: 'Mac OS X'
     *     }
     *   }
     * })
     * ```
     */
    capabilities: W3CCapabilities | DesiredCapabilities
    /**
     * Level of logging verbosity.
     *
     * @default 'info'
     */
    logLevel?: WebDriverLogTypes;
    /**
     * Set specific log levels per logger
     * use 'silent' level to disable logger
     */
    logLevels?: Record<string, WebDriverLogTypes | undefined>;
    /**
     * Timeout for any WebDriver request to a driver or grid.
     *
     * @default 120000
     */
    connectionRetryTimeout?: number;
    /**
     * Count of request retries to the Selenium server.
     *
     * @default 3
     */
    connectionRetryCount?: number;
    /**
     * Specify custom headers to pass into every request.
     */
    headers?: {
        [name: string]: string;
    };
    /**
     * Allows you to use a custom http/https/http2 [agent](https://www.npmjs.com/package/got#agent) to make requests.
     *
     * @default
     * ```js
     * {
     *     http: new http.Agent({ keepAlive: true }),
     *     https: new https.Agent({ keepAlive: true })
     * }
     * ```
     */
    agent?: {
        http: http.Agent,
        https: https.Agent
    };
    /**
     * Function intercepting [HTTP request options](https://github.com/sindresorhus/got#options) before a WebDriver request is made.
     */
    transformRequest?: (requestOptions: got.Options) => got.Options;
    /**
     * Function intercepting HTTP response objects after a WebDriver response has arrived.
     */
    transformResponse?: (response: got.Response, requestOptions: got.Options) => got.Response;

    /**
     * Appium direct connect options (see: https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments)
     */
    directConnectProtocol?: string
    directConnectHost?: string
    directConnectPort?: number
    directConnectPath?: string

    /**
     * Whether it requires SSL certificates to be valid in HTTP/s requests
     * for an environment which cannot get process environment well.
     *
     * @default true
     */
    strictSSL?: boolean;

    /**
     * Directory to store all testrunner log files (including reporter logs and `wdio` logs).
     * If not set, all logs are streamed to `stdout`. Since most reporters are made to log to
     * `stdout`, it is recommended to only use this option for specific reporters where it
     * makes more sense to push report into a file (like the `junit` reporter, for example).
     *
     * When running in standalone mode, the only log generated by WebdriverIO will be
     * the `wdio` log.
     */
    outputDir?: string
}
