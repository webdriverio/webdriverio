import * as got from 'got'
import http from 'http'
import https from 'https'
import { EventEmitter } from 'events'

export type PageLoadingStrategy = 'none' | 'eager' | 'normal';
export type ProxyTypes = 'pac' | 'noproxy' | 'autodetect' | 'system' | 'manual';
export type WebDriverLogTypes = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'silent';
export type LoggingPreferenceType =
    'OFF' | 'SEVERE' | 'WARNING' |
    'INFO' | 'CONFIG' | 'FINE' |
    'FINER' | 'FINEST' | 'ALL';
export type FirefoxLogLevels =
    'trace' | 'debug' | 'config' |
    'info' | 'warn' | 'error' | 'fatal';
export type Timeouts = Record<'script' | 'pageLoad' | 'implicit', number>;
export type SameSiteOptions = 'Lax' | 'Strict';

export interface ProxyObject {
    proxyType?: ProxyTypes;
    proxyAutoconfigUrl?: string;
    ftpProxy?: string;
    ftpProxyPort?: number;
    httpProxy?: string;
    httpProxyPort?: number;
    sslProxy?: string;
    sslProxyPort?: number;
    socksProxy?: string;
    socksProxyPort?: number;
    socksVersion?: string;
    socksUsername?: string;
    socksPassword?: string;
}

export interface LoggingPreferences {
    browser?: LoggingPreferenceType;
    driver?: LoggingPreferenceType;
    server?: LoggingPreferenceType;
    client?: LoggingPreferenceType;
}

export interface Cookie {
    /**
     * The name of the cookie.
     */
    name: string;
    /**
     * The cookie value.
     */
    value: string;
    /**
     * The cookie path. Defaults to "/" if omitted when adding a cookie.
     */
    path?: string;
    /**
     * The domain the cookie is visible to. Defaults to the current browsing context’s
     * active document’s URL domain if omitted when adding a cookie.
     */
    domain?: string;
    /**
     * Whether the cookie is a secure cookie. Defaults to false if omitted when adding
     * a cookie.
     */
    secure?: boolean;
    /**
     * Whether the cookie is an HTTP only cookie. Defaults to false if omitted when
     * adding a cookie.
     */
    httpOnly?: boolean;
    /**
     * When the cookie expires, specified in seconds since Unix Epoch. Must not be set if
     * omitted when adding a cookie.
     */
    expiry?: number;
    /**
     * Whether the cookie applies to a SameSite policy. Defaults to None if omitted when
     * adding a cookie. Can be set to either "Lax" or "Strict".
     */
    sameSite?: SameSiteOptions
}

export interface ChromeOptions {
    /**
     * List of command-line arguments to use when starting Chrome. Arguments with an
     * associated value should be separated by a '=' sign (e.g., `['start-maximized', 'user-data-dir=/tmp/temp_profile']`).
     * See here for a list of Chrome arguments.
     */
    args?: string[];
    /**
     * Path to the Chrome executable to use (on Mac OS X, this should be the actual binary,
     * not just the app. e.g., '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
     */
    binary?: string;
    /**
     * A list of Chrome extensions to install on startup. Each item in the list should
     * be a base-64 encoded packed Chrome extension (.crx)
     */
    extensions?: string[];
    /**
     * A dictionary with each entry consisting of the name of the preference and its value.
     * These preferences are applied to the Local State file in the user data folder.
     */
    localState?: {
        [name: string]: any;
    };
    /**
     * If false, Chrome will be quit when ChromeDriver is killed, regardless of whether
     * the session is quit. If true, Chrome will only be quit if the session is quit
     * (or closed). Note, if true, and the session is not quit, ChromeDriver cannot clean
     * up the temporary user data directory that the running Chrome instance is using.
     */
    detach?: boolean;
    /**
     * An address of a Chrome debugger server to connect to, in the form of `<hostname/ip:port>`,
     * e.g. '127.0.0.1:38947'
     */
    debuggerAddress?: string;
    /**
     * List of Chrome command line switches to exclude that ChromeDriver by default passes
     * when starting Chrome.  Do not prefix switches with --.
     */
    excludeSwitches?: string[];
    /**
     * Directory to store Chrome minidumps . (Supported only on Linux.)
     */
    minidumpPath?: string;
    /**
     * A dictionary with either a value for “deviceName,” or values for “deviceMetrics” and
     * “userAgent.” Refer to Mobile Emulation for more information.
     */
    mobileEmulation?: {
        [name: string]: any;
    };
    /**
     * An optional dictionary that specifies performance logging preferences. See
     * [Chromedriver docs](http://chromedriver.chromium.org/capabilities) for
     * more information.
     */
    perfLoggingPrefs?: {
        enableNetwork?: boolean;
        enablePage?: boolean;
        enableTimeline?: boolean;
        tracingCategories?: boolean;
        bufferUsageReportingInterval?: boolean;
    };
    /**
     * A dictionary with each entry consisting of the name of the preference and its value.
     * These preferences are only applied to the user profile in use. See the 'Preferences'
     * file in Chrome's user data directory for examples.
     */
    prefs?: {
        [name: string]: string | number | boolean;
    };
    /**
     * A list of window types that will appear in the list of window handles. For access
     * to <webview> elements, include "webview" in this list.
     */
    windowTypes?: string[];
}

/**
 * Chromium Edge
 */
interface MicrosoftEdgeOptions extends ChromeOptions {}

export interface FirefoxLogObject {
    level: FirefoxLogLevels
}

export interface GeckodriverCapabilities {
    'firefox_binary'?: string;
    firefoxProfileTemplate?: string;
    captureNetworkTraffic?: boolean;
    addCustomRequestHeaders?: boolean;
    trustAllSSLCertificates?: boolean;
    changeMaxConnections?: boolean;
    profile?: string;
    pageLoadingStrategy?: string;
}

export interface FirefoxOptions {
    debuggerAddress?: string
    binary?: string
    args?: string[]
    profile?: string
    log?: FirefoxLogObject
    prefs?: {
        [name: string]: string | number | boolean
    }
}

export interface SelenoidOptions {
    enableVNC?: boolean,
    screenResolution?: string,
    enableVideo?: boolean,
    videoName?: string,
    videoScreenSize?: string,
    videoFrameRate?: number,
    videoCodec?: string,
    enableLog?: boolean,
    logName?: string,
    name?: string,
    sessionTimeout?: string,
    timeZone?: string,
    env?: string[],
    applicationContainers?: string[],
    hostsEntries?: string[],
    dnsServers?: string[],
    additionalNetworks?: string[],
    labels?: Map<string, string>,
    skin?: string,
    s3KeyPattern?: string
}

export interface Capabilities extends VendorExtensions {
    /**
     * Identifies the user agent.
     */
    browserName?: string;
    /**
     * Identifies the version of the user agent.
     */
    browserVersion?: string;
    /**
     * Identifies the operating system of the endpoint node.
     */
    platformName?: string;
    /**
     * Indicates whether untrusted and self-signed TLS certificates are implicitly trusted on navigation for the duration of the session.
     */
    acceptInsecureCerts?: boolean;
    /**
     * Defines the current session’s page load strategy.
     */
    pageLoadStrategy?: PageLoadingStrategy;
    /**
     * Defines the current session’s proxy configuration.
     */
    proxy?: ProxyObject;
    /**
     * Indicates whether the remote end supports all of the resizing and repositioning commands.
     */
    setWindowRect?: boolean;
    /**
     * Describes the timeouts imposed on certain session operations.
     */
    timeouts?: Timeouts;
    /**
     * Defines the current session’s strict file interactability.
     */
    strictFileInteractability?: boolean,
    /**
     * Describes the current session’s user prompt handler. Defaults to the dismiss and notify state.
     */
    unhandledPromptBehavior?: string;
}

export interface W3CCapabilities {
    alwaysMatch: Capabilities;
    firstMatch: Capabilities[];
}

export interface DesiredCapabilities extends Capabilities, SauceLabsCapabilities, TestingbotCapabilities, SeleniumRCCapabilities, AppiumIOSCapabilities, GeckodriverCapabilities, IECapabilities, AppiumAndroidCapabilities, AppiumCapabilities, VendorExtensions, GridCapabilities, ChromeCapabilities {
    // Read-only capabilities
    cssSelectorsEnabled?: boolean;
    handlesAlerts?: boolean;
    version?: string;
    platform?: string;
    public?: any;

    loggingPrefs?: {
        browser?: LoggingPreferences;
        driver?: LoggingPreferences;
        server?: LoggingPreferences;
        client?: LoggingPreferences;
    };

    // Read-write capabilities
    javascriptEnabled?: boolean;
    databaseEnabled?: boolean;
    locationContextEnabled?: boolean;
    applicationCacheEnabled?: boolean;
    browserConnectionEnabled?: boolean;
    webStorageEnabled?: boolean;
    acceptSslCerts?: boolean;
    rotatable?: boolean;
    nativeEvents?: boolean;
    unexpectedAlertBehaviour?: string;
    elementScrollBehavior?: number;

    // RemoteWebDriver specific
    'webdriver.remote.sessionid'?: string;
    'webdriver.remote.quietExceptions'?: boolean;

    // Selenese-Backed-WebDriver specific
    'selenium.server.url'?: string;

    // webdriverio specific
    specs?: string[];
    exclude?: string[];
}

export interface VendorExtensions extends EdgeCapabilities {
    // Selenoid specific
    'selenoid:options'?: SelenoidOptions
    // Testingbot w3c specific
    'tb:options'?: TestingbotCapabilities
    // Saucelabs w3c specific
    'sauce:options'?: SauceLabsCapabilities
    // Browserstack w3c specific
    'bstack:options'?: {
        [name: string]: any
    }

    'goog:chromeOptions'?: ChromeOptions;
    'moz:firefoxOptions'?: FirefoxOptions;
    'ms:edgeOptions'?: MicrosoftEdgeOptions;
    'ms:edgeChromium'?: MicrosoftEdgeOptions;

    // Safari specific
    'safari.options'?: {
        [name: string]: any;
    };
}

// Selenium Grid specific
export interface GridCapabilities {
    // Grid-specific
    seleniumProtocol?: string;
    maxInstances?: number;
    environment?: string;
}

// Edge specific
export interface EdgeCapabilities {
    'ms:inPrivate'?: boolean;
    'ms:extensionPaths'?: string[];
    'ms:startPage'?: string;
}

// Chrome specific
export interface ChromeCapabilities {
    chrome?: string;
    chromeOptions?: ChromeOptions;
    mobileEmulationEnabled?: boolean;
}

// Appium General Capabilities
export interface AppiumCapabilities {
    automationName?: string;
    platformVersion?: string;
    deviceName?: string;
    app?: string;
    newCommandTimeout?: number;
    language?: string;
    locale?: string;
    udid?: string;
    orientation?: string;
    autoWebview?: boolean;
    noReset?: boolean;
    fullReset?: boolean;
    eventTimings?: boolean;
    enablePerformanceLogging?: boolean;
    printPageSourceOnFindFailure?: boolean;
}

export interface AppiumAndroidCapabilities {
    // Appium Android Only
    appiumVersion?: string;
    appActivity?: string;
    appPackage?: string;
    appWaitActivity?: string;
    appWaitPackage?: string;
    appWaitDuration?: number;
    deviceReadyTimeout?: number;
    allowTestPackages?: boolean;
    androidCoverage?: string;
    androidCoverageEndIntent?: string;
    androidDeviceReadyTimeout?: number;
    androidInstallTimeout?: number;
    androidInstallPath?: string;
    adbPort?: number;
    systemPort?: number;
    remoteAdbHost?: string;
    androidDeviceSocket?: string;
    avd?: string;
    avdLaunchTimeout?: number;
    avdReadyTimeout?: number;
    avdArgs?: string;
    useKeystore?: boolean;
    keystorePath?: string;
    keystorePassword?: string;
    keyAlias?: string;
    keyPassword?: string;
    chromedriverExecutable?: string;
    chromedriverArgs?: string[];
    chromedriverExecutableDir?: string;
    chromedriverChromeMappingFile?: string;
    chromedriverUseSystemExecutable?: boolean;
    autoWebviewTimeout?: number;
    chromedriverPort?: number;
    chromedriverPorts?: (number | number[])[]
    intentAction?: string;
    intentCategory?: string;
    intentFlags?: string;
    optionalIntentArguments?: string;
    dontStopAppOnReset?: boolean;
    unicodeKeyboard?: boolean;
    resetKeyboard?: boolean;
    noSign?: boolean;
    ignoreUnimportantViews?: boolean;
    disableAndroidWatchers?: boolean;
    recreateChromeDriverSessions?: boolean;
    nativeWebScreenshot?: boolean;
    androidScreenshotPath?: string;
    autoGrantPermissions?: boolean;
    networkSpeed?: string;
    gpsEnabled?: boolean;
    isHeadless?: boolean;
    adbExecTimeout?: number;
    localeScript?: string;
    skipDeviceInitialization?: boolean;
    chromedriverDisableBuildCheck?: boolean;
    skipUnlock?: boolean;
    unlockType?: string;
    unlockKey?: string;
    autoLaunch?: boolean;
    skipLogcatCapture?: boolean;
    uninstallOtherPackages?: string;
    disableWindowAnimation?: boolean;
    otherApps?: string;
    uiautomator2ServerLaunchTimeout?: number;
    uiautomator2ServerInstallTimeout?: number;
    skipServerInstallation?: boolean;
    espressoServerLaunchTimeout?: number;
}

// Appium iOS Only
export interface AppiumIOSCapabilities {
    calendarFormat?: string;
    bundleId?: string;
    launchTimeout?: number;
    locationServicesEnabled?: boolean;
    locationServicesAuthorized?: boolean;
    autoAcceptAlerts?: boolean;
    autoDismissAlerts?: boolean;
    nativeInstrumentsLib?: boolean;
    nativeWebTap?: boolean;
    safariInitialUrl?: string;
    safariAllowPopups?: boolean;
    safariIgnoreFraudWarning?: boolean;
    safariOpenLinksInBackground?: boolean;
    keepKeyChains?: boolean;
    localizableStringsDir?: string;
    processArguments?: string;
    interKeyDelay?: number;
    showIOSLog?: boolean;
    sendKeyStrategy?: string;
    screenshotWaitTimeout?: number;
    waitForAppScript?: string;
    webviewConnectRetries?: number;
    appName?: string;
    customSSLCert?: string;
    webkitResponseTimeout?: number;
    remoteDebugProxy?: string;
    enableAsyncExecuteFromHttps?: boolean;
    skipLogCapture?: boolean;
    webkitDebugProxyPort?: number;
}

// IE specific
export interface IECapabilities {
    'ie.forceCreateProcessApi'?: boolean;
    'ie.browserCommandLineSwitches'?: string;
    'ie.usePerProcessProxy'?: boolean;
    'ie.ensureCleanSession'?: boolean;
    'ie.setProxyByServer'?: boolean;
    'ie.fileUploadDialogTimeout'?: number;
    'ie.edgechromium'?: boolean;
    'ie.edgepath'?: string;
    ignoreProtectedModeSettings?: boolean;
    ignoreZoomSetting?: boolean;
    initialBrowserUrl?: string;
    enablePersistentHover?: boolean;
    enableElementCacheCleanup?: boolean;
    requireWindowFocus?: boolean;
    browserAttachTimeout?: number;
    logFile?: string;
    logLevel?: string;
    host?: string;
    extractPath?: string;
    silent?: string;
    killProcessesByName?: boolean;
}

/**
 * see also https://wiki.saucelabs.com/display/DOCS/Test+Configuration+Options
 */
export interface SauceLabsCapabilities {
    // Sauce Labs Custom Testing Options
    tunnelIdentifier?: string
    parentTunnel?: string
    screenResolution?: string
    timeZone?: string
    avoidProxy?: boolean
    public?: string
    prerun?: {
        executable: string
        args: string[]
        background: boolean
        timeout: number
    }

    // Optional Sauce Labs Testing Features
    recordVideo?: boolean
    videoUploadOnPass?: boolean
    recordScreenshots?: boolean
    recordLogs?: boolean
    priority?: number
    extendedDebugging?: boolean
    capturePerformance?: boolean

    // Optional Selenium Capabilities for Sauce Labs Tests
    seleniumVersion?: string
    chromedriverVersion?: string
    iedriverVersion?: string

    // timeouts
    maxDuration?: number
    commandTimeout?: number
    idleTimeout?: number
}

/**
 * https://testingbot.com/support/other/test-options#platform
 */
export interface TestingbotCapabilities {
    public?: boolean;
}

export interface SeleniumRCCapabilities {
    // Selenium RC (1.0) only
    commandLineFlags?: string;
    executablePath?: string;
    timeoutInSeconds?: number;
    onlyProxySeleniumTraffic?: boolean;
    avoidProxy?: boolean;
    proxyEverything?: boolean;
    proxyRequired?: boolean;
    browserSideLog?: boolean;
    optionsSet?: boolean;
    singleWindow?: boolean;
    dontInjectRegex?: RegExp;
    userJSInjection?: boolean;
    userExtensions?: string;
}

export interface Options {
    /**
     * Your cloud service username (only works for Sauce Labs, Browserstack, TestingBot,
     * CrossBrowserTesting or LambdaTest accounts). If set, WebdriverIO will automatically
     * set connection options for you.
     */
    user?: string;
    /**
     * Your cloud service access key or secret key (only works for Sauce Labs, Browserstack,
     * TestingBot, CrossBrowserTesting or LambdaTest accounts). If set, WebdriverIO will
     * automatically set connection options for you.
     */
    key?: string;
    /**
     * Protocol to use when communicating with the Selenium standalone server (or driver).
     */
    protocol?: string;
    /**
     * Host of your WebDriver server.
     */
    hostname?: string;
    /**
     * Port your WebDriver server is on.
     */
    port?: number;
    /**
     * Path to WebDriver endpoint or grid server.
     */
    path?: string;
    /**
     * Query paramaters that are propagated to the driver server.
     */
    queryParams?: {
        [name: string]: string;
    },
    /**
     * Defines the [capabilities](https://w3c.github.io/webdriver/webdriver-spec.html#capabilities) you want to run in your Selenium session.
     */
    capabilities?: DesiredCapabilities | W3CCapabilities;
    requestedCapabilities?: DesiredCapabilities | W3CCapabilities;
    /**
     * Level of logging verbosity.
     */
    logLevel?: WebDriverLogTypes;
    /**
     * Set specific log levels per logger
     * use 'silent' level to disable logger
     */
    logLevels?: Record<string, WebDriverLogTypes | undefined>;
    /**
     * Timeout for any WebDriver request to a driver or grid.
     */
    connectionRetryTimeout?: number;
    /**
     * Count of request retries to the Selenium server.
     */
    connectionRetryCount?: number;
    /**
     * Timeout for any request to the Selenium server
     */
    connectionPollInterval?: number
    /**
     * Specify custom headers to pass into every request.
     */
    headers?: {
        [name: string]: string;
    };
    /**
     * Allows you to use a custom http/https/http2 [agent](https://www.npmjs.com/package/got#agent) to make requests.
     */
    agent?: {
        http: http.Agent,
        https: https.Agent
    };
    /**
     * Function intercepting [HTTP request options](https://github.com/sindresorhus/got#options) before a WebDriver request is made.
     */
    transformRequest?: (requestOptions: got.HTTPSOptions) => got.HTTPSOptions;
    /**
     * Function intercepting HTTP response objects after a WebDriver response has arrived.
     */
    transformResponse?: (response: got.Response, requestOptions: got.HTTPSOptions) => got.Response;

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
     */
    strictSSL?: boolean;
}

export interface JSONWPCommandError extends Error {
    code?: string
    statusCode?: string
    statusMessage?: string
}

export interface SessionFlags {
    isW3C: boolean;
    isChrome: boolean;
    isAndroid: boolean;
    isMobile: boolean;
    isIOS: boolean;
    isSauce: boolean;
    isSeleniumStandalone: boolean;
}

export interface BaseClient extends EventEmitter, SessionFlags {
    // id of WebDriver session
    sessionId: string;
    // assigned capabilities by the browser driver / WebDriver server
    capabilities: DesiredCapabilities | W3CCapabilities;
    // original requested capabilities
    requestedCapabilities: DesiredCapabilities | W3CCapabilities;
    // framework options
    options: Options
}

export interface Client extends BaseClient {}
export interface ClientAsync extends AsyncClient, BaseClient { }

type AsyncClient = {
    [K in keyof Pick<Client, Exclude<keyof Client, keyof BaseClient>>]:
    (...args: Parameters<Client[K]>) => Promise<ReturnType<Client[K]>>;
}

export interface AttachOptions extends Partial<SessionFlags>, Partial<Options> {
    sessionId: string
    capabilities?: DesiredCapabilities
    isW3C?: boolean
}
