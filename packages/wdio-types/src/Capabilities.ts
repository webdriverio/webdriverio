import {
    WebdriverIO as WebDriverIOOptions,
    Connection as ConnectionOptions
} from './Options'

export type PageLoadingStrategy = 'none' | 'eager' | 'normal';
export type LoggingPreferenceType =
    'OFF' | 'SEVERE' | 'WARNING' |
    'INFO' | 'CONFIG' | 'FINE' |
    'FINER' | 'FINEST' | 'ALL';
export interface LoggingPreferences {
    browser?: LoggingPreferenceType;
    driver?: LoggingPreferenceType;
    server?: LoggingPreferenceType;
    client?: LoggingPreferenceType;
}

export type Timeouts = Record<'script' | 'pageLoad' | 'implicit', number>;

export type ProxyTypes = 'pac' | 'noproxy' | 'autodetect' | 'system' | 'manual';
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

export interface Capabilities extends VendorExtensions, ConnectionOptions {
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

export type RemoteCapabilities = (DesiredCapabilities | W3CCapabilities)[] | MultiRemoteCapabilities;
export interface MultiRemoteCapabilities {
    [instanceName: string]: WebDriverIOOptions;
}

export type RemoteCapability = DesiredCapabilities | W3CCapabilities | MultiRemoteCapabilities;

export interface DesiredCapabilities extends Capabilities, SauceLabsCapabilities, SauceLabsVisualCapabilities, TestingbotCapabilities, SeleniumRCCapabilities, AppiumIOSCapabilities, GeckodriverCapabilities, IECapabilities, AppiumAndroidCapabilities, AppiumCapabilities, AppiumW3CCapabilities, VendorExtensions, GridCapabilities, ChromeCapabilities, BrowserStackCapabilities {
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
    excludeDriverLogs?: string[];
}

export interface VendorExtensions extends EdgeCapabilities, AppiumW3CCapabilities {
    // Selenoid specific
    'selenoid:options'?: SelenoidOptions
    // Testingbot w3c specific
    'tb:options'?: TestingbotCapabilities
    // Sauce Labs w3c specific
    'sauce:options'?: SauceLabsCapabilities
    // Sauce Labs Visual
    'sauce:visual'?: SauceLabsVisualCapabilities
    // Browserstack w3c specific
    'bstack:options'?: BrowserStackCapabilities
    'browserstack.local'?: boolean

    'goog:chromeOptions'?: ChromeOptions;
    'moz:firefoxOptions'?: FirefoxOptions;
    // eslint-disable-next-line
    firefox_profile?: string;
    'ms:edgeOptions'?: MicrosoftEdgeOptions;
    'ms:edgeChromium'?: MicrosoftEdgeOptions;

    // Safari specific
    'safari.options'?: {
        [name: string]: any;
    };

    /**
     * @deprecated
     */
    // eslint-disable-next-line
    testobject_api_key?: string
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

export type FirefoxLogLevels =
    'trace' | 'debug' | 'config' |
    'info' | 'warn' | 'error' | 'fatal';

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

// Appium General W3C Capabilities
export interface AppiumW3CCapabilities {
    'appium:automationName'?: string;
    'appium:platformVersion'?: string;
    'appium:deviceName'?: string;
    'appium:app'?: string;
    'appium:newCommandTimeout'?: number;
    'appium:language'?: string;
    'appium:locale'?: string;
    'appium:udid'?: string;
    'appium:orientation'?: string;
    'appium:autoWebview'?: boolean;
    'appium:noReset'?: boolean;
    'appium:fullReset'?: boolean;
    'appium:eventTimings'?: boolean;
    'appium:enablePerformanceLogging'?: boolean;
    'appium:printPageSourceOnFindFailure'?: boolean;
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
    name?: string
    build?: string | number
    tags?: string[]
    'custom-data'?: any
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

export interface BrowserStackCapabilities {
    browser?: string
    // eslint-disable-next-line
    browser_version?: string
    os?: string
    // eslint-disable-next-line
    os_version?: string
    osVersion?: string
    desired?: DesiredCapabilities
    device?: string
    projectName?: string
    buildName?: string
    sessionName?: string
    local?: boolean
    debug?: boolean
    networkLogs?: boolean
    seleniumVersion?: string
    ie?: {
        noFlash?: boolean,
        compatibility?: number
        arch?:string
        driver?: string
        enablePopups?: boolean
    }
    userName?: string
    accessKey?: string
    localIdentifier?: string
    consoleLogs?: 'disable' | 'errors' | 'warnings' | 'info' | 'verbose'
    appiumLogs?: boolean
    video?: boolean
    seleniumLogs?: boolean
    geoLocation?: string
    timezone?: string
    resolution?: string
    'browserstack.maskCommands'?: string[]
    idleTimeout?: number
    maskBasicAuth?: boolean
    autoWait?: number
    hosts?: string
    bfcache?: 0 | 1
    wsLocalSupport?: boolean
    deviceName?: string
    realMobile?: boolean
    appiumVersion?: string
    deviceOrientation?: 'portrait' | 'landscape'
    customNetwork?: string
    networkProfile?: string
    chrome?: {
        driver?: string
    }
    edge?: {
        enablePopups?: boolean
    }
    'browserstack.sendKeys'?: boolean
    safari?: {
        enablePopups?: boolean
        allowAllCookies?: boolean
        driver?: string
    }
    firefox?: {
        driver?: string
    }
    browserName?: string
    browserVersion?: string
    acceptSslCerts?: boolean
}

export interface SauceLabsVisualCapabilities {
    /**
     * Project name
     */
    projectName?: string
    /**
     * API Key for user's Screener account.
     */
    apiKey?: string
    /**
     * A <width>x<height> representation of desired viewport size.
     * @default "1024x768"
     */
    viewportSize?: string
    /**
     * Branch or environment name.
     * @example "main"
     */
    branch?: string
    /**
     * Branch name of project's base branch. Used for baseline branching and merging.
     * @example "main"
     */
    baseBranch?: string
    /**
     * Visual diff options to control validations.
     * @default
     * ```js
     * {
     *   structure: true,
     *   layout: true,
     *   style: true,
     *   content: true,
     *   minLayoutPosition: 4,
     *   minLayoutDimension: 10
     * }
     * ```
     */
    diffOptions?: {
        structure?: boolean
        layout?: boolean
        style?: boolean
        content?: boolean
        minLayoutPosition?: number
        minLayoutDimension?: number
    }
    /**
     * A comma-delimited list of css selectors to ignore when performing visual diffs.
     * @example "#some-id, .some-selector"
     */
    ignore?: string
    /**
     * Option to set build to failure when new states are found, and to disable
     * using new states as a baseline.
     *
     * This option defaults to true, and can be set to false if user wants new
     * states to automatically be the visual baseline without needing to review
     * and accept them.
     * @default true
     */
    failOnNewStates?: boolean
    /**
     * Option to automatically accept new and changed states in base branch.
     * Assumes base branch should always be correct.
     * @default false
     */
    alwaysAcceptBaseBranch?: boolean
    /**
     * Option to disable independent baseline for each feature branch, and
     * only use base branch as baseline. Must be used with "baseBranch" option.
     * @default false
     */
    disableBranchBaseline?: boolean
    /**
     * Option to capture a full-page screenshot using a scrolling and stitching
     * strategy instead of using native browser full-page screenshot capabilities.
     * @default false
     */
    scrollAndStitchScreenshots?: boolean
    /**
     * Option to disable adding CORS headers. By default, CORS headers are set
     * for all cross-origin requests.
     * @default false
     */
    disableCORS?: boolean
}

/**
 * https://testingbot.com/support/other/test-options#platform
 */
export interface TestingbotCapabilities {
    name?: string;
    tags?: string[];
    build?: string | number | number;
    public?: boolean;
    'tunnel-identifier'?: string
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
