import * as http from 'node:http'
import * as https from 'node:https'
import type { RegisterOptions } from './Compiler'
import type { URL } from 'node:url'

import { W3CCapabilities, DesiredCapabilities, RemoteCapabilities, RemoteCapability, MultiRemoteCapabilities, Capabilities } from './Capabilities'
import { Hooks, ServiceEntry } from './Services'
import { ReporterEntry } from './Reporters'

export type WebDriverLogTypes = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent'
export type SupportedProtocols = 'webdriver' | 'devtools' | './protocol-stub.js'
export type Agents = {http?: any, https?: any}

export interface RequestLibOptions {
    agent?: Agents | null
    followRedirect?: boolean
    headers?: Record<string, unknown>
    https?: Record<string, unknown>
    json?: Record<string, unknown>
    method?: string
    responseType?: string
    retry?: number
    searchParams?: Record<string, unknown>
    throwHttpErrors?: boolean
    timeout?: number
    url?: URL
    path?: string
    username?: string
    password?: string
    body?: any
}

export interface RequestLibResponse {
    statusCode: number
    body?: any
    rawBody?: Buffer
}

/**
 * WebdriverIO allows to connect to different WebDriver endpoints by capability
 * so these connection options need to be part of capabilities
 */
export interface Connection {
    /**
     * Protocol to use when communicating with the Selenium standalone server (or driver).
     *
     * @default 'http'
     */
    protocol?: string
    /**
     * Host of your WebDriver server.
     *
     * @default 'localhost'
     */
    hostname?: string
    /**
     * Port your WebDriver server is on.
     *
     * @default 4444
     */
    port?: number
    /**
     * Path to WebDriver endpoint or grid server.
     *
     * @default '/'
     */
    path?: string
    /**
     * Query paramaters that are propagated to the driver server.
     */
    queryParams?: {
        [name: string]: string
    }
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
}

export interface WebDriver extends Connection {
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
    logLevel?: WebDriverLogTypes
    /**
     * Set specific log levels per logger
     * use 'silent' level to disable logger
     */
    logLevels?: Record<string, WebDriverLogTypes>
    /**
     * Timeout for any WebDriver request to a driver or grid.
     *
     * @default 120000
     */
    connectionRetryTimeout?: number
    /**
     * Count of request retries to the Selenium server.
     *
     * @default 3
     */
    connectionRetryCount?: number
    /**
     * Specify custom headers to pass into every request.
     */
    headers?: {
        [name: string]: string
    }
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
    }
    /**
     * Function intercepting [HTTP request options](https://github.com/sindresorhus/got#options) before a WebDriver request is made.
     */
    transformRequest?: (requestOptions: RequestLibOptions) => RequestLibOptions
    /**
     * Function intercepting HTTP response objects after a WebDriver response has arrived.
     */
    transformResponse?: (response: RequestLibResponse, requestOptions: RequestLibOptions) => RequestLibResponse

    /**
     * Appium direct connect options (see: https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments)
     */
    enableDirectConnect?: boolean;

    /**
     * Whether it requires SSL certificates to be valid in HTTP/s requests
     * for an environment which cannot get process environment well.
     *
     * @default true
     */
    strictSSL?: boolean

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

export interface MultiRemoteBrowserOptions {
    sessionId?: string
    capabilities: DesiredCapabilities
}

export type SauceRegions = 'us' | 'eu' | 'apac' | 'us-west-1' | 'us-east-1' | 'eu-central-1' | 'apac-southeast-1' | 'staging'

export interface WebdriverIO extends Omit<WebDriver, 'capabilities'> {
    /**
     * Defines the capabilities you want to run in your WebDriver session. Check out the
     * [WebDriver Protocol](https://w3c.github.io/webdriver/#capabilities) for more details.
     * If you want to run a multiremote session you need to define instead of an array of
     * capabilities an object that has an arbitrary browser instance name as string and its
     * capabilities as values.
     *
     * @example
     * ```js
     * // wdio.conf.js
     * exports.config
     *   // ...
     *   capabilities: {
     *     browserName: 'safari',
     *     platformName: 'MacOS 10.13',
     *     ...
     *   }
     * }
     * ```
     *
     * @example
     * ```
     * // wdio.conf.js
     * exports.config
     *   // ...
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
    capabilities: RemoteCapability
    /**
     * Define the protocol you want to use for your browser automation.
     * Currently only [`webdriver`](https://www.npmjs.com/package/webdriver) and
     * [`devtools`](https://www.npmjs.com/package/devtools) are supported,
     * as these are the main browser automation technologies available.
     */
    automationProtocol?: SupportedProtocols
    /**
     * If running on Sauce Labs, you can choose to run tests between different datacenters:
     * US or EU. To change your region to EU, add region: 'eu' to your config.
     */
    region?: SauceRegions
    /**
     * Sauce Labs provides a headless offering that allows you to run Chrome and Firefox tests headless.
     */
    headless?: boolean
    /**
     * Shorten url command calls by setting a base URL.
     */
    baseUrl?: string
    /**
     * Default timeout for all `waitFor*` commands. (Note the lowercase f in the option name.)
     * This timeout only affects commands starting with `waitFor*` and their default wait time.
     */
    waitforTimeout?: number
    /**
     * Default interval for all `waitFor*` commands to check if an expected state (e.g.,
     * visibility) has been changed.
     */
    waitforInterval?: number
}

export interface Testrunner extends Hooks, Omit<WebdriverIO, 'capabilities'>, WebdriverIO.HookFunctionExtension {
    /**
     * Defines a set of capabilities you want to run in your testrunner session. Check out the
     * [WebDriver Protocol](https://w3c.github.io/webdriver/#capabilities) for more details.
     * If you want to run a multiremote session you need to define instead of an array of
     * capabilities an object that has an arbitrary browser instance name as string and its
     * capabilities as values.
     *
     * @example
     * ```js
     * // wdio.conf.js
     * exports.config
     *   // ...
     *   capabilities: [{
     *     browserName: 'safari',
     *     platformName: 'MacOS 10.13',
     *     ...
     *   }, {
     *     browserName: 'microsoftedge',
     *     platformName: 'Windows 10',
     *     ...
     *   }]
     * }
     * ```
     *
     * @example
     * ```
     * // wdio.conf.js
     * exports.config
     *   // ...
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
    capabilities: RemoteCapabilities
    /**
     * Type of runner (currently only "local" is supported)
     */
    runner?: 'local'
    /**
     * Define specs for test execution. You can either specify a glob
     * pattern to match multiple files at once or wrap a glob or set of
     * paths into an array to run them within a single worker process.
     */
    specs?: (string | string[])[]
    /**
     * Exclude specs from test execution.
     */
    exclude?: string[]
    /**
     * An object describing various of suites, which you can then specify
     * with the --suite option on the wdio CLI.
     */
    suites?: Record<string, string[]>
    /**
     * Maximum number of total parallel running workers.
     */
    maxInstances?: number
    /**
     * Maximum number of total parallel running workers per capability.
     */
    maxInstancesPerCapability?: number
    /**
     * If you want your test run to stop after a specific number of test failures, use bail.
     * (It defaults to 0, which runs all tests no matter what.) Note: Please be aware that
     * when using a third party test runner (such as Mocha), additional configuration might
     * be required.
     */
    bail?: number
    /**
     * The number of retry attempts for an entire specfile when it fails as a whole.
     */
    specFileRetries?: number
    /**
     * Delay in seconds between the spec file retry attempts
     */
    specFileRetriesDelay?: number
    /**
     * Whether or not retried specfiles should be retried immediately or deferred to the end of the queue
     */
    specFileRetriesDeferred?: boolean
    /**
     * Services take over a specific job you don't want to take care of. They enhance
     * your test setup with almost no effort.
     */
    services?: ServiceEntry[]
    /**
     * Defines the test framework to be used by the WDIO testrunner.
     */
    framework?: string
    /**
     * List of reporters to use. A reporter can be either a string, or an array of
     * `['reporterName', { <reporter options> }]` where the first element is a string
     * with the reporter name and the second element an object with reporter options.
     */
    reporters?: ReporterEntry[]
    /**
     * Determines in which interval the reporter should check if they are synchronised
     * if they report their logs asynchronously (e.g. if logs are streamed to a 3rd
     * party vendor).
     */
    reporterSyncInterval?: number
    /**
     * Determines the maximum time reporters have to finish uploading all their logs
     * until an error is being thrown by the testrunner.
     */
    reporterSyncTimeout?: number
    /**
     * Node arguments to specify when launching child processes.
     */
    execArgv?: string[]
    /**
     * A set of environment variables to be injected into the worker process.
     */
    runnerEnv?: Record<string, any>
    /**
     * Files to watch when running `wdio` with the `--watch` flag.
     */
    filesToWatch?: string[]
    /**
     * List of cucumber features with line numbers (when using [cucumber framework](https://webdriver.io/docs/frameworks.html#using-cucumber)).
     * @default []
     */
    cucumberFeaturesWithLineNumbers?: string[]
    /**
     * flags
     */
    watch?: boolean
    /**
     * framework options
     */
    mochaOpts?: WebdriverIO.MochaOpts
    jasmineOpts?: WebdriverIO.JasmineOpts
    cucumberOpts?: WebdriverIO.CucumberOpts
    /**
     * autocompile options
     */
    autoCompileOpts?: AutoCompileConfig
}

export interface TSConfigPathsOptions {
    baseUrl: string
    paths: Record<string, string[]>
    mainFields?: string[]
    addMatchAll?: boolean
}

export interface AutoCompileConfig {
    autoCompile?: boolean
    tsNodeOpts?: RegisterOptions
    babelOpts?: Record<string, any>
    tsConfigPathsOpts?: TSConfigPathsOptions
}

export interface MultiRemote extends Omit<Testrunner, 'capabilities'> {
    capabilities: MultiRemoteCapabilities
}

export type Definition<T> = {
    [k in keyof T]: {
        type: 'string' | 'number' | 'object' | 'boolean' | 'function'
        default?: T[k]
        required?: boolean
        validate?: (option: T[k]) => void
        match?: RegExp
    }
}

export interface RunnerStart {
    cid: string
    specs: string[]
    config: Testrunner
    isMultiremote: boolean
    instanceOptions: Record<string, WebdriverIO>
    sessionId: string
    capabilities: Capabilities
    retry?: number
    failures?: number
    retries?: number
}

export interface RunnerEnd {
    failures: number
    cid: string
    retries: number
}
