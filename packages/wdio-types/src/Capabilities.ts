import type {
    WebDriver as WebDriverOptions,
    WebdriverIO as WebDriverIOOptions,
    Connection as ConnectionOptions
} from './Options.js'

type JSONLike = | { [property: string]: JSONLike } | readonly JSONLike[] | string | number | boolean | null

// Type to remove 'appium:' prefix from property keys
type RemoveAppiumPrefix<T> = {
    [K in keyof T as K extends `appium:${infer R}` ? R : K]: T[K]
}

export type PageLoadingStrategy = 'none' | 'eager' | 'normal'
export type LoggingPreferenceType =
    'OFF' | 'SEVERE' | 'WARNING' |
    'INFO' | 'CONFIG' | 'FINE' |
    'FINER' | 'FINEST' | 'ALL'

export interface LoggingPreferences {
    browser?: LoggingPreferenceType
    driver?: LoggingPreferenceType
    server?: LoggingPreferenceType
    client?: LoggingPreferenceType
}

export type Timeouts = Record<'script' | 'pageLoad' | 'implicit', number>

export type ProxyTypes = 'pac' | 'noproxy' | 'autodetect' | 'system' | 'manual'

export interface ProxyObject {
    proxyType?: ProxyTypes
    proxyAutoconfigUrl?: string
    ftpProxy?: string
    ftpProxyPort?: number
    httpProxy?: string
    httpProxyPort?: number
    sslProxy?: string
    sslProxyPort?: number
    socksProxy?: string
    socksProxyPort?: number
    socksVersion?: string
    socksUsername?: string
    socksPassword?: string
    noProxy?: string[]
}

declare global {
    namespace WebdriverIO {
        interface Capabilities extends VendorExtensions, ConnectionOptions {
            /**
             * Identifies the user agent.
             */
            browserName?: string
            /**
             * Identifies the version of the user agent.
             */
            browserVersion?: string
            /**
             * Identifies the operating system of the endpoint node.
             */
            platformName?: string
            /**
             * Indicates whether untrusted and self-signed TLS certificates are implicitly trusted on navigation for the duration of the session.
             */
            acceptInsecureCerts?: boolean
            /**
             * Defines the current session’s page load strategy.
             */
            pageLoadStrategy?: PageLoadingStrategy
            /**
             * Defines the current session’s proxy configuration.
             */
            proxy?: ProxyObject
            /**
             * Indicates whether the remote end supports all of the resizing and repositioning commands.
             */
            setWindowRect?: boolean
            /**
             * Describes the timeouts imposed on certain session operations.
             */
            timeouts?: Timeouts
            /**
             * Defines the current session’s strict file interactability.
             */
            strictFileInteractability?: boolean
            /**
             * Describes the current session’s user prompt handler. Defaults to the dismiss and notify state.
             */
            unhandledPromptBehavior?: string
            /**
             * WebDriver clients opt in to a bidirectional connection by requesting a capability with the name "webSocketUrl" and value true.
             */
            webSocketUrl?: boolean
        }
    }
}

export interface W3CCapabilities {
    alwaysMatch: WebdriverIO.Capabilities
    firstMatch: WebdriverIO.Capabilities[]
}
export type RequestedStandaloneCapabilities = W3CCapabilities | WebdriverIO.Capabilities
export type RequestedMultiremoteCapabilities = {
    [instanceName: string]: WebDriverIOOptions & WithRequestedCapabilities
}

/**
 * Configuration object for the `webdriver` package
 */
export type RemoteConfig = WebDriverOptions & WithRequestedCapabilities

/**
 * Configuration object for the `webdriverio` package
 */
export type WebdriverIOConfig = WebDriverIOOptions & WithRequestedCapabilities
export type WebdriverIOMultiremoteConfig = WebDriverIOOptions & { capabilities: RequestedMultiremoteCapabilities }

/**
 * A type referencing all possible capability types when using Testrunner
 * e.g. everything a user can provide in the `capabilities` property
 */
export type TestrunnerCapabilities = RequestedStandaloneCapabilities[] | RequestedMultiremoteCapabilities | RequestedMultiremoteCapabilities[]

/**
 * The capabilities that will be resolved within a worker instance, e.g. either
 * a single set of capabilities or a single multiremote instance
 */
export type ResolvedTestrunnerCapabilities = WebdriverIO.Capabilities | Record<string, WebdriverIO.Capabilities>

/**
 * The `capabilities` property is a required property when using the `remote` method.
 */
export interface WithRequestedCapabilities {
    /**
     * Defines the capabilities you want to run in your WebDriver session. Check out the
     * documentation on [Capabilities](https://webdriver.io/docs/capabilities) for more details.
     *
     * @example
     * ```js
     * // WebDriver session
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
    capabilities: RequestedStandaloneCapabilities
}

/**
 * The `capabilities` property is a required property when defining a testrunner configuration.
 */
export interface WithRequestedTestrunnerCapabilities {
    /**
     * Defines a set of capabilities you want to run in your WebDriver session. Check out the
     * documentation on [Capabilities](https://webdriver.io/docs/capabilities) for more details.
     *
     * @example
     * ```js
     * // wdio.conf.js
     * export const config = {
     *   // define parallel running capabilities
     *   capabilities: [{
     *     browserName: 'safari',
     *     platformName: 'MacOS 10.13',
     *     ...
     *   }, {
     *     browserName: 'microsoftedge',
     *     platformName: 'Windows 10',
     *     ...
     *   }, {
     *     // using alwaysMatch and firstMatch
     *   alwaysMatch: {
     *     browserName: 'chrome',
     *     browserVersion: 86
     *      // ...
     *   },
     *   firstMatch: [{
     *     browserName: 'chrome',
     *      // ...
     *   }]
     * }
     * ```
     */
    capabilities: RequestedStandaloneCapabilities[]
}

/**
 * The `capabilities` property is a required property when using the `remote` method to initiate a multiremote session.
 */
export interface WithRequestedMultiremoteCapabilities {
    /**
     * Defines the capabilities for each Multiremote client. Check out the
     * documentation on [Capabilities](https://webdriver.io/docs/capabilities) for more details.
     *
     * @example
     * ```
     * // wdio.conf.js
     * export const config = {
     *   // multiremote example
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
     * // or with parallel multiremote sessions
     * ```
     * // wdio.conf.js
     * export const config = {
     *   capabilities: [{
     *     browserA: {
     *       port: 4444,
     *       capabilities: {
     *         browserName: 'chrome',
     *         browserVersion: 86
     *         platformName: 'Windows 10'
     *       }
     *     },
     *     browserB: {
     *       port: 4444,
     *       capabilities: {
     *         browserName: 'firefox',
     *         browserVersion: 74
     *         platformName: 'Mac OS X'
     *       }
     *     }
     *   }, {
     *     browserA: {
     *       port: 4444,
     *       capabilities: {
     *         browserName: 'chrome',
     *         browserVersion: 86
     *         platformName: 'Windows 10'
     *       }
     *     },
     *     browserB: {
     *       port: 4444,
     *       capabilities: {
     *         browserName: 'firefox',
     *         browserVersion: 74
     *         platformName: 'Mac OS X'
     *       }
     *     }
     *   }]
     * })
     * ```
     */
    capabilities: RequestedMultiremoteCapabilities | RequestedMultiremoteCapabilities[]
}

export interface VendorExtensions extends EdgeCapabilities, AppiumCapabilities, WebdriverIOCapabilities,
    WebdriverIO.WDIOVSCodeServiceOptions, AppiumXCUITestCapabilities, AppiumAndroidCapabilities {

    // Appium Options
    'appium:options'?: AppiumOptions
    // Aerokube Selenoid specific
    'selenoid:options'?: SelenoidOptions
    // Aerokube Moon specific
    'moon:options'?: MoonOptions
    // Testingbot w3c specific
    'tb:options'?: TestingbotCapabilities
    // Sauce Labs w3c specific
    'sauce:options'?: SauceLabsCapabilities
    // Sauce Labs Visual
    'sauce:visual'?: SauceLabsVisualCapabilities
    // Experitest Access Keys
    'experitest:accessKey'?: string
    //LambdaTest w3c specific
    'LT:Options'?: LambdaTestCapabilities
    // Browserstack w3c specific
    'bstack:options'?: BrowserStackCapabilities
    'browserstack.local'?: boolean
    'browserstack.accessibility'?: boolean
    'browserstack.accessibilityOptions'?: { [key: string]: any }
    /**
     * @private
     */
    'browserstack.wdioService'?: string
    'browserstack.buildIdentifier'?: string
    'browserstack.localIdentifier'?: string
    'browserstack.testhubBuildUuid'?: string
    'browserstack.buildProductMap'?: { [key: string]: boolean }

    'goog:chromeOptions'?: ChromeOptions
    'moz:firefoxOptions'?: FirefoxOptions
    // This capability is a boolean when send as part of the capabilities to Geckodriver
    // and is being returns as string (e.g. "<host>:<port>") when session capabilities
    // are returned from the driver
    // see https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html#moz-debuggeraddress
    'moz:debuggerAddress'?: string | boolean
    'ms:edgeOptions'?: MicrosoftEdgeOptions
    'ms:edgeChromium'?: MicrosoftEdgeOptions

    // Windows Application Driver
    'ms:experimental-webdriver'?: boolean
    'ms:waitForAppLaunch'?: string

    // Safari specific
    'safari.options'?: {
        [name: string]: any
    }

    /**
     * Selenium 4.0 Specific
     */
    'se:cdp'?: string
}

export type AppiumOptions = RemoveAppiumPrefix<AppiumCapabilities & AppiumXCUITestCapabilities & AppiumAndroidCapabilities>

export interface WebdriverIOCapabilities {
    /**
     * process id of driver attached to given session
     */
    'wdio:driverPID'?: number
    'wdio:chromedriverOptions'?: WebdriverIO.ChromedriverOptions
    'wdio:safaridriverOptions'?: WebdriverIO.SafaridriverOptions
    'wdio:geckodriverOptions'?: WebdriverIO.GeckodriverOptions
    'wdio:edgedriverOptions'?: WebdriverIO.EdgedriverOptions

    /**
    * Maximum number of total parallel running workers (per capability)
    */
    'wdio:maxInstances'?: number

    /**
    * Define specs for test execution. You can either specify a glob
    * pattern to match multiple files at once or wrap a glob or set of
    * paths into an array to run them within a single worker process.
    */
    'wdio:specs'?: string[]

    /**
     * Exclude specs from test execution.
     */
    'wdio:exclude'?: string[]

    /**
     * If flag is set to `true` WebdriverIO will not automatically opt-in
     * to the WebDriver BiDi protocol. This is useful if you want to use
     * the WebDriver protocol only.
     */
    'wdio:enforceWebDriverClassic'?: boolean
}

export interface ChromeOptions {
    /**
     * List of command-line arguments to use when starting Chrome. Arguments with an
     * associated value should be separated by a '=' sign (e.g., `['start-maximized', 'user-data-dir=/tmp/temp_profile']`).
     * See here for a list of Chrome arguments.
     */
    args?: string[]
    /**
     * Path to the Chrome executable to use (on Mac OS X, this should be the actual binary,
     * not just the app. e.g., '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
     */
    binary?: string
    /**
     * A list of Chrome extensions to install on startup. Each item in the list should
     * be a base-64 encoded packed Chrome extension (.crx)
     */
    extensions?: string[]
    /**
     * A dictionary with each entry consisting of the name of the preference and its value.
     * These preferences are applied to the Local State file in the user data folder.
     */
    localState?: {
        [name: string]: any
    }
    /**
     * If false, Chrome will be quit when ChromeDriver is killed, regardless of whether
     * the session is quit. If true, Chrome will only be quit if the session is quit
     * (or closed). Note, if true, and the session is not quit, ChromeDriver cannot clean
     * up the temporary user data directory that the running Chrome instance is using.
     */
    detach?: boolean
    /**
     * An address of a Chrome debugger server to connect to, in the form of `<hostname/ip:port>`,
     * e.g. '127.0.0.1:38947'
     */
    debuggerAddress?: string
    /**
     * List of Chrome command line switches to exclude that ChromeDriver by default passes
     * when starting Chrome.  Do not prefix switches with --.
     */
    excludeSwitches?: string[]
    /**
     * Directory to store Chrome minidumps . (Supported only on Linux.)
     */
    minidumpPath?: string
    /**
     * A dictionary with either a value for "deviceName", or values for "deviceMetrics" and
     * "userAgent". Refer to Mobile Emulation for more information.
     */
    mobileEmulation?: {
        userAgent?: string
        deviceName?: string
        deviceMetrics?: {
            width?: number
            height?: number
            pixelRatio?: number
            touch?: boolean
        }
    }
    /**
     * An optional dictionary that specifies performance logging preferences. See
     * [Chromedriver docs](http://chromedriver.chromium.org/capabilities) for
     * more information.
     */
    perfLoggingPrefs?: {
        /**
         * Whether or not to collect events from Network domain.
         * @default true
         */
        enableNetwork?: boolean
        /**
         * Whether or not to collect events from Page domain.
         * @default true
         */
        enablePage?: boolean
        /**
         * A comma-separated string of Chrome tracing categories for which trace events
         * should be collected. An unspecified or empty string disables tracing.
         * @default ''
         */
        tracingCategories?: string
        /**
         * The requested number of milliseconds between DevTools trace buffer
         * usage events. For example, if 1000, then once per second, DevTools
         * will report how full the trace buffer is. If a report indicates the
         * buffer usage is 100%, a warning will be issued.
         * @default 1000
         */
        bufferUsageReportingInterval?: number
    }
    /**
     * A dictionary with each entry consisting of the name of the preference and its value.
     * These preferences are only applied to the user profile in use. See the 'Preferences'
     * file in Chrome's user data directory for examples.
     */
    prefs?: Record<string, JSONLike>
    /**
     * A list of window types that will appear in the list of window handles. For access
     * to <webview> elements, include "webview" in this list.
     */
    windowTypes?: string[]
}

/**
 * Chromium Edge
 */
interface MicrosoftEdgeOptions extends ChromeOptions {
}

export type FirefoxLogLevels =
    'trace' | 'debug' | 'config' |
    'info' | 'warn' | 'error' | 'fatal'

export interface FirefoxLogObject {
    level: FirefoxLogLevels
}

export interface FirefoxOptions {
    debuggerAddress?: string
    binary?: string
    args?: string[]
    profile?: string
    log?: FirefoxLogObject
    prefs?: {
        [name: string]: string[] | string | number | boolean
    }
}

// Aerokube Selenoid specific
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

// Aerokube Moon specific
export type MoonMobileDeviceOrientation =
    'portrait' | 'vertical' | 'landscape' | 'horizontal'

export interface MoonOptions extends SelenoidOptions {
    mobileDevice?: {
        deviceName: string
        orientation: MoonMobileDeviceOrientation
    }
    logLevel?: string
}

// Edge specific
export interface EdgeCapabilities {
    'ms:inPrivate'?: boolean
    'ms:extensionPaths'?: string[]
    'ms:startPage'?: string
}

/**
 * Appium General W3C Capabilities
 *
 * @see https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/
 */
export interface AppiumCapabilities {
    /**
     * Which automation engine to use.
     *
     * Acceptable values:
     * + 'Appium' (default)
     * + 'UiAutomator2' for Android
     * + 'Espresso' for Android
     * + 'UiAutomator1' for Android
     * + 'XCUITest' or 'Instruments' for iOS
     * + 'YouiEngine' for application built with You.i Engine
     */
    'appium:automationName'?: string
    /**
     * Which mobile OS platform to use.
     *
     * Acceptable values:
     * + 'iOS'
     * + 'Android'
     * + 'FirefoxOS'
     */
    'appium:platformName'?: string
    /**
     * Expected mobile OS version, eg: '7.1', '4.4' etc.
     */
    'appium:platformVersion'?: string
    /**
     * The kind of mobile device or emulator to use, for each platform, it accept different kind of values.
     *
     * ### For iOS, it could be:
     *
     * + Simulator name, eg: 'iPhone Simulator', 'iPad Simulator', 'iPhone Retina 4-inch'.
     * + Instruments name, which comes from 'instruments -s devices' command.
     * + xctrace device name, which comes from 'xcrun xctrace list devices' command. (since Xcode 12)
     *
     * ### For Android, this capability is currently ignored, though it remains required.
     * Note: This document is written with appium 1.22.1 release, this behavior may changed later.
     */
    'appium:deviceName'?: string
    /**
     * The absolute local path or remote http URL to a .ipa file (IOS), .app folder (IOS Simulator), .apk file (Android)
     * or [.apks file (Android App Bundle)](https://appium.github.io/appium.io/docs/en/writing-running-appium/android/android-appbundle/index.html),
     * or a .zip file containing one of these.
     *
     * Appium will attempt to install this app binary on the appropriate device first.
     * Note that this capability is not required for Android if you specify appPackage and appActivity capabilities.
     * UiAutomator2 and XCUITest allow to start the session without app or appPackage.
     */
    'appium:app'?: string
    /**
     * The id of the app to be tested. eg: 'com.android.chrome'.
     */
    'appium:appPackage'?: string
    'appium:appWaitActivity'?: string
    'appium:newCommandTimeout'?: number
    'appium:language'?: string
    'appium:locale'?: string
    'appium:animationCoolOffTimeout'?: number
    /**
     * iOS Unique Device Identifier
     */
    'appium:udid'?: string
    'appium:orientation'?: string
    'appium:autoWebview'?: boolean
    'appium:noReset'?: boolean
    'appium:fullReset'?: boolean
    'appium:eventTimings'?: boolean
    'appium:enablePerformanceLogging'?: boolean
    'appium:printPageSourceOnFindFailure'?: boolean
    'appium:nativeWebTap'?: boolean
    /**
     * Users as directConnect feature by the server
     * https://appiumpro.com/editions/86-connecting-directly-to-appium-hosts-in-distributed-environments
     */
    'appium:directConnectProtocol'?: string
    'appium:directConnectHost'?: string
    'appium:directConnectPort'?: number
    'appium:directConnectPath'?: string
    /**
     * Windows-specific capability: Please see https://github.com/appium/appium-windows-driver#usage
     * This is a hexadecimal handle of an existing application top level window to attach to. Either this
     * capability or 'appium:app' must be provided on session startup.
     */
    'appium:appTopLevelWindow'?: string
    /**
     * https://appium.io/docs/en/2.11/guides/settings/#initializing-settings-via-capabilities
     */
    'appium:settings'?: Record<string, any>
}

/**
 * Appium Android Only Capabilities
 *
 * @see https://appium.github.io/appium.io/docs/en/writing-running-appium/caps/#android-only
 */
export interface AppiumAndroidCapabilities {
    'appium:appiumVersion'?: string
    'appium:appActivity'?: string
    'appium:appPackage'?: string
    'appium:appWaitActivity'?: string
    'appium:appWaitPackage'?: string
    'appium:appWaitDuration'?: number
    'appium:deviceReadyTimeout'?: number
    'appium:allowTestPackages'?: boolean
    'appium:androidCoverage'?: string
    'appium:androidCoverageEndIntent'?: string
    'appium:androidDeviceReadyTimeout'?: number
    'appium:androidInstallTimeout'?: number
    'appium:androidInstallPath'?: string
    'appium:adbPort'?: number
    'appium:systemPort'?: number
    'appium:remoteAdbHost'?: string
    'appium:androidDeviceSocket'?: string
    'appium:avd'?: string
    'appium:avdLaunchTimeout'?: number
    'appium:avdReadyTimeout'?: number
    'appium:avdArgs'?: string
    'appium:useKeystore'?: boolean
    'appium:keystorePath'?: string
    'appium:keystorePassword'?: string
    'appium:keyAlias'?: string
    'appium:keyPassword'?: string
    'appium:chromedriverExecutable'?: string
    'appium:chromedriverArgs'?: string[]
    'appium:chromedriverExecutableDir'?: string
    'appium:chromedriverChromeMappingFile'?: string
    'appium:chromedriverUseSystemExecutable'?: boolean
    'appium:autoWebviewTimeout'?: number
    'appium:chromedriverPort'?: number
    'appium:chromedriverPorts'?: (number | number[])[]
    'appium:intentAction'?: string
    'appium:intentCategory'?: string
    'appium:intentFlags'?: string
    'appium:optionalIntentArguments'?: string
    'appium:dontStopAppOnReset'?: boolean
    'appium:unicodeKeyboard'?: boolean
    'appium:resetKeyboard'?: boolean
    'appium:noSign'?: boolean
    'appium:ignoreUnimportantViews'?: boolean
    'appium:disableAndroidWatchers'?: boolean
    'appium:recreateChromeDriverSessions'?: boolean
    'appium:nativeWebScreenshot'?: boolean
    'appium:androidScreenshotPath'?: string
    'appium:autoGrantPermissions'?: boolean
    'appium:networkSpeed'?: string
    'appium:gpsEnabled'?: boolean
    'appium:isHeadless'?: boolean
    'appium:adbExecTimeout'?: number
    'appium:localeScript'?: string
    'appium:skipDeviceInitialization'?: boolean
    'appium:chromedriverDisableBuildCheck'?: boolean
    'appium:skipUnlock'?: boolean
    'appium:unlockType'?: string
    'appium:unlockKey'?: string
    'appium:autoLaunch'?: boolean
    'appium:skipLogcatCapture'?: boolean
    'appium:uninstallOtherPackages'?: string
    'appium:disableWindowAnimation'?: boolean
    'appium:otherApps'?: string | string[]
    'appium:uiautomator2ServerLaunchTimeout'?: number
    'appium:uiautomator2ServerInstallTimeout'?: number
    'appium:skipServerInstallation'?: boolean
    'appium:espressoServerLaunchTimeout'?: number
    'appium:disableSuppressAccessibilityService'?: boolean
    'appium:hideKeyboard'?: boolean
    'appium:autoWebviewName'?: string

    'appium:uiautomator2ServerReadTimeout'?: number
    'appium:appWaitForLaunch'?: boolean
    'appium:remoteAppsCacheLimit'?: number
    'appium:enforceAppInstall'?: boolean
    'appium:clearDeviceLogsOnStart'?: boolean
    'appium:buildToolsVersion'?: string
    'appium:suppressKillServer'?: boolean
    'appium:ignoreHiddenApiPolicyError'?: boolean
    'appium:mockLocationApp'?: string
    'appium:logcatFormat'?: string
    'appium:logcatFilterSpecs'?: string
    'appium:allowDelayAdb'?: boolean
    'appium:avdEnv'?: { [key: string]: string }
    'appium:unlockStrategy'?: string
    'appium:unlockSuccessTimeout'?: number
    'appium:webviewDevtoolsPort'?: number
    'appium:ensureWebviewsHavePages'?: boolean
    'appium:enableWebviewDetailsCollection'?: boolean
    'appium:extractChromeAndroidPackageFromContextName'?: boolean
    'appium:showChromedriverLog'?: boolean
    'appium:chromeOptions'?: { [key: string]: any }
    'appium:chromeLoggingPrefs'?: { [key: string]: any }
    'appium:userProfile'?: number
}

/**
 * Appium xcuitest Capabilities
 *
 * @see https://github.com/appium/appium-xcuitest-driver
 */
export interface AppiumXCUITestCapabilities {
    'appium:platformName'?: string
    'appium:browserName'?: string
    'appium:app'?: string
    'appium:calendarFormat'?: string
    'appium:bundleId'?: string
    'appium:launchTimeout'?: number
    'appium:udid'?: string
    'appium:appName'?: string
    'appium:waitForAppScript'?: string
    'appium:sendKeyStrategy'?: string
    'appium:screenshotWaitTimeout'?: number
    'appium:interKeyDelay'?: number
    'appium:nativeInstrumentsLib'?: boolean
    'appium:autoAcceptAlerts'?: boolean
    'appium:autoDismissAlerts'?: boolean
    'appium:nativeWebTap'?: boolean
    'appium:safariInitialUrl'?: string
    'appium:safariAllowPopups'?: boolean
    'appium:safariIgnoreFraudWarning'?: boolean
    'appium:safariOpenLinksInBackground'?: boolean
    'appium:safariShowFullResponse'?: boolean
    'appium:keepKeyChains'?: boolean
    'appium:locationServicesEnabled'?: boolean
    'appium:locationServicesAuthorized'?: boolean
    'appium:resetLocationService'?: boolean
    'appium:localizableStringsDir'?: string
    'appium:processArguments'?: string | AppiumXCUIProcessArguments
    'appium:showIOSLog'?: boolean
    'appium:webviewConnectRetries'?: number
    'appium:clearSystemFiles'?: boolean
    'appium:customSSLCert'?: string
    'appium:webkitResponseTimeout'?: number
    'appium:webkitDebugProxyPort'?: number
    'appium:remoteDebugProxy'?: string
    'appium:enablePerformanceLogging'?: boolean
    'appium:enableAsyncExecuteFromHttps'?: boolean
    'appium:fullContextList'?: boolean
    'appium:ignoreAboutBlankUrl'?: boolean
    'appium:skipLogCapture'?: boolean
    'appium:deviceName'?: string
    'appium:showXcodeLog'?: boolean
    'appium:wdaLocalPort'?: number
    'appium:wdaBaseUrl'?: string
    'appium:iosInstallPause'?: number
    'appium:xcodeConfigFile'?: string
    'appium:xcodeOrgId'?: string
    'appium:xcodeSigningId'?: string
    'appium:keychainPath'?: string
    'appium:keychainPassword'?: string
    'appium:bootstrapPath'?: string
    'appium:agentPath'?: string
    'appium:tapWithShortPressDuration'?: number
    'appium:scaleFactor'?: string
    'appium:usePrebuiltWDA'?: boolean
    'appium:usePreinstalledWDA'?: boolean
    'appium:webDriverAgentUrl'?: string
    'appium:derivedDataPath'?: string
    'appium:launchWithIDB'?: boolean
    'appium:useNewWDA'?: boolean
    'appium:wdaLaunchTimeout'?: number
    'appium:wdaConnectionTimeout'?: number
    'appium:updatedWDABundleId'?: string
    'appium:resetOnSessionStartOnly'?: boolean
    'appium:commandTimeouts'?: string | AppiumXCUICommandTimeouts
    'appium:wdaStartupRetries'?: number
    'appium:wdaStartupRetryInterval'?: number
    'appium:prebuildWDA'?: boolean
    'appium:connectHardwareKeyboard'?: boolean
    'appium:forceTurnOnSoftwareKeyboardSimulator'?: boolean
    'appium:simulatorPasteboardAutomaticSync'?: string
    'appium:simulatorDevicesSetPath'?: string
    'appium:calendarAccessAuthorized'?: boolean
    'appium:useSimpleBuildTest'?: boolean
    'appium:waitForQuiescence'?: boolean
    'appium:maxTypingFrequency'?: number
    'appium:nativeTyping'?: boolean
    'appium:simpleIsVisibleCheck'?: boolean
    'appium:shouldUseSingletonTestManager'?: boolean
    'appium:isHeadless'?: boolean
    'appium:autoGrantPermissions'?: boolean
    'appium:useXctestrunFile'?: boolean
    'appium:absoluteWebLocations'?: boolean
    'appium:simulatorWindowCenter'?: string
    'appium:simulatorStartupTimeout'?: number
    'appium:simulatorTracePointer'?: boolean
    'appium:useJSONSource'?: boolean
    'appium:enforceFreshSimulatorCreation'?: boolean
    'appium:shutdownOtherSimulators'?: boolean
    'appium:keychainsExcludePatterns'?: string
    'appium:showSafariConsoleLog'?: boolean
    'appium:showSafariNetworkLog'?: boolean
    'appium:safariGarbageCollect'?: boolean
    'appium:safariGlobalPreferences'?: AppiumXCUISafariGlobalPreferences
    'appium:safariLogAllCommunication'?: boolean
    'appium:safariLogAllCommunicationHexDump'?: boolean
    'appium:safariSocketChunkSize'?: number
    'appium:mjpegServerPort'?: number
    'appium:reduceMotion'?: boolean
    'appium:mjpegScreenshotUrl'?: string
    'appium:permissions'?: string
    'appium:screenshotQuality'?: number
    'appium:wdaEventloopIdleDelay'?: number
    'appium:otherApps'?: string | string[]
    'appium:includeSafariInWebviews'?: boolean
    'appium:additionalWebviewBundleIds'?: Array<string>
    'appium:webviewConnectTimeout'?: number
    'appium:iosSimulatorLogsPredicate'?: string
    'appium:appPushTimeout'?: number
    'appium:nativeWebTapStrict'?: boolean
    'appium:safariWebInspectorMaxFrameLength'?: number
    'appium:allowProvisioningDeviceRegistration'?: boolean
    'appium:waitForIdleTimeout'?: number
    'appium:resultBundlePath'?: string
    'appium:resultBundleVersion'?: number
    'appium:safariIgnoreWebHostnames'?: string
    'appium:includeDeviceCapsToSessionInfo'?: boolean
    'appium:disableAutomaticScreenshots'?: boolean
    'appium:shouldTerminateApp'?: boolean
    'appium:forceAppLaunch'?: boolean
    'appium:useNativeCachingStrategy'?: boolean
    'appium:appInstallStrategy'?: string
    /**
     * Windows Application Driver capabilities
     */
    'appium:appArguments'?: string
}

export interface AppiumXCUISafariGlobalPreferences {
    [key: string]: any
}

export interface AppiumXCUIProcessArguments {
    args?: Array<string>
    env?: { [key: string]: any }
}

export interface AppiumXCUICommandTimeouts {
    [key: string]: any
}

/**
 * see also https://docs.saucelabs.com/dev/test-configuration-options
 */
export interface SauceLabsCapabilities {
    /**
     * Desktop Browser Capabilities: Sauce-Specific – Optional
     * see https://docs.saucelabs.com/dev/test-configuration-options/#desktop-browser-capabilities-sauce-specific--optional
     */

    /**
     * Allows you to specify the ChromeDriver version you want to use for your tests.
     * The default version of ChromeDriver when no value is specified depends on the version of Chrome used.
     * As of Chrome 73, the major version of the driver and the browser must match.
     *
     * Desktop Virtual Devices only.
     *
     * For a list of ChromeDriver versions, see chromedriver versions list.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#chromedriverversion
     * @see https://chromedriver.storage.googleapis.com/index.html
     */
    chromedriverVersion?: string

    /**
     * Specifies the Microsoft Edge driver version you want to use for your tests.
     *
     * Desktop Virtual Devices only.
     *
     * For a list of edgedriver versions, see the Microsoft Edge Driver website.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#edgedriverversion
     * @see https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/
     */
    edgedriverVersion?: string

    /**
     * Specifies the Firefox GeckoDriver version.
     * The default geckodriver version varies based on the version of Firefox specified.
     *
     * Desktop Virtual Devices only.
     *
     * For a list of geckodriver versions and the Firefox versions they support, see geckodriver Supported Platforms.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#geckodriverversion
     * @see https://firefox-source-docs.mozilla.org/testing/geckodriver/Support.html
     */
    geckodriverVersion?: string

    /**
     * Specifies the Internet Explorer Driver version. If no version is specified, it defaults to 2.53.1.
     *
     * Desktop Virtual Devices only.
     *
     * For a list of IE Driver versions, see Internet Explorer Driver Server CHANGELOG.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#iedriverversion
     * @see https://raw.githubusercontent.com/SeleniumHQ/selenium/trunk/cpp/iedriverserver/CHANGELOG
     */
    iedriverVersion?: string

    /**
     * Specifies the Selenium version you want to use for your test.
     * Sauce Labs will default to different versions, depending on the age of the browser and platform,
     * and whether or not you're initializing a session with valid W3C syntax.
     *
     * Desktop Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#seleniumversion
     */
    seleniumVersion?: string

    /**
     * Allows the browser to communicate directly with servers without going through a proxy.
     * By default, Sauce routes traffic from Internet Explorer and Safari through an HTTP proxy server
     * so that HTTPS connections with self-signed certificates will work.
     *
     * The proxy server can cause problems for some users, and this setting allows you to avoid it.
     *
     * Any test run with a Sauce Connect tunnel has to use the proxy and this flag will be ignored.
     *
     * Desktop Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#avoidproxy
     */
    avoidProxy?: boolean

    /**
     * Enables Extended Debugging features. This applies to Firefox and Chrome only.
     * It records HAR files and console logs for both of these browsers.
     * In Chrome, it also enables network interception, network and cpu throttling as well as access to network logs
     * during the session. It is required to be true for capturePerformance. The default value is false.
     *
     * Desktop Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#extendeddebugging
     * @see https://docs.saucelabs.com/insights/debug/
     */
    extendedDebugging?: boolean

    /**
     * Enables Performance Capture feature.
     * Sauce Performance Testing can be enabled by setting both extendedDebugging and capturePerformance to true.
     * Default value is false.
     *
     * Desktop Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#captureperformance
     * @see https://docs.saucelabs.com/performance/
     */
    capturePerformance?: boolean

    /**
     * Specifies the screen resolution to be used during your test session.
     * Default screen resolution for Sauce tests is 1024x768.
     *
     * Desktop Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#screenresolution
     */
    screenResolution?: string

    /**
     * Sets command timeout in seconds.
     * As a safety measure to prevent Selenium crashes from making your tests run indefinitely,
     * we limit how long Selenium can take to run a command in our browsers.
     * This is set to 300 seconds by default. The maximum command timeout value allowed is 600 seconds.
     *
     * Desktop Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#commandtimeout
     */
    commandTimeout?: number

    /**
     * Sets idle test timeout in seconds.
     * As a safety measure to prevent tests from running too long after something has gone wrong,
     * we limit how long a browser can wait for a test to send a new command.
     * This is set to 90 seconds by default and limited to a maximum value of 1000 seconds.
     *
     * Desktop Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#idletimeout
     */
    idleTimeout?: number

    /**
     * Mobile App Appium Capabilities: Sauce-Specific – Optional
     * see https://docs.saucelabs.com/dev/test-configuration-options/#mobile-app-appium-capabilities-sauce-specific--optional
     */

    /**
     * Specifies the Appium driver version you want to use.
     * For most use cases, setting the appiumVersion is unnecessary because Sauce Labs defaults to the version that supports the broadest number of device combinations.
     * Sauce Labs advises against setting this property unless you need to test a particular Appium feature or patch.
     *
     * Virtual and Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#appiumversion
     */
    appiumVersion?: string

    /**
     * Specifies the orientation of the virtual skin and screen during the test.
     *
     * Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#deviceorientation
     */
    deviceOrientation?: 'portrait' | 'landscape'

    /**
     * If your app creates an extra log then you can use the customLogFiles to store those additional logs in the "Logs" tab of the executed automated session.
     * It is created in the form of a list of search filters that enumerate after an app test to locate text files to upload as logs.
     * Files are uploaded with the .log extension appended. The search paths are rooted at the application under test.
     *
     * Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#customlogfiles
     */
    customLogFiles?: string[]

    /**
     * By default, our emulator uses software rendering to handle graphics for maximum compatibility.
     * This involves the CPU calculating how everything looks on your app's screen.
     * However, this could lead to an emulator crash when testing apps with intricate or heavy graphical elements.
     * To mitigate this, use the hardware rendering option by specifying "android.gpu.mode"="hardware" in your test capabilities.
     *
     * Android Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#androidgpumode
     */
    'android.gpu.mode'?: 'software' | 'hardware'

    /**
     * Android allows apps to use the full screen, hiding the status bar and navigation bar.
     * This is called "immersive mode". When you run an Android test, the device will show a popup asking if you want to allow the app to use immersive mode.
     * This popup can interfere with your test, and by default we disable it.
     * If you want to enable it, set disableImmersiveModePopUp to false.
     *
     * Android Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#disableimmersivemodepopup
     */
    disableImmersiveModePopUp?: boolean

    /**
     * Sets up the device pin code for the automated test session.
     * This capability sets your device in the state required for your application to launch successfully.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#disableimmersivemodepopup
     */
    setupDeviceLock?: boolean

    /**
     * Use this capability to select only tablet devices for testing.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#tabletonly
     */
    tabletOnly?: boolean

    /**
     * Use this capability to select only phone devices for testing.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#phoneonly
     */
    phoneOnly?: boolean

    /**
     * Use this capability to select only private devices for testing.
     *
     * Private Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#privatedevicesonly
     */
    privateDevicesOnly?: boolean

    /**
     * Use this capability to select only public devices for testing.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#publicdevicesonly
     */
    publicDevicesOnly?: boolean

    /**
     * Use this capability to allocate only devices connected to a carrier network.
     *
     * Private Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#carrierconnectivityonly
     */
    carrierConnectivityOnly?: boolean

    /**
     * Keeps the device allocated to you between test sessions and bypasses the device cleaning process and session exit that occurs by default after each test completes.
     * Normally, you'd need to start over and reopen another device.
     * You'll need to launch your next test within 10 seconds of your previous test ending
     * to ensure that the same device will be allocated for the test (not cleaned or reset).
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#cacheid
     */
    cacheId?: string

    /**
     * Controls Sauce Labs default resigning (iOS) or instrumentation (Android) of mobile apps installed on our devices.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#resigningenabled
     */
    resigningEnabled?: boolean

    /**
     * Enables the camera image injection feature. resigningEnabled needs to be enabled if this is set to true.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/mobile-apps/features/camera-image-injection/
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#saucelabsimageinjectionenabled
     */
    sauceLabsImageInjectionEnabled?: boolean

    /**
     * Bypasses the restriction on taking screenshots for secure screens (i.e., secure text entry). resigningEnabled needs to be enabled if this is set to true.
     *
     * Android Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#saucelabsbypassscreenshotrestriction
     */
    sauceLabsBypassScreenshotRestriction?: boolean

    /**
     * Enables the interception of biometric input, allowing the test to simulate Touch ID interactions (not a Sauce Labs-specific capability).
     * resigningEnabled needs to be enabled if this is set to true.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#allowtouchidenroll
     */
    allowTouchIdEnroll?: boolean

    /**
     * Enables audio recording in your iOS and Android native mobile app tests.
     * The audio will be part of the Test Results page video file, which you can play back and download in our built-in media player.
     * The default value is false.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#audiocapture
     */
    audioCapture?: boolean

    /**
     * Enables mobile app instrumentation (Android or iOS) and recording of HTTP/HTTPS network traffic for debugging purposes.
     * API calls are collected into a HAR file, which you can view and download from your Test Results > Network tab console.
     * The default value is false.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#networkcapture
     */
    networkCapture?: boolean

    /**
     * Enables the use of the app's private app container directory instead of the shared app group container directory.
     * For testing on the Real Device Cloud, the app gets resigned, which is why the shared directory is not accessible.
     *
     * iOS Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#groupfolderredirectenabled
     */
    groupFolderRedirectEnabled?: boolean

    /**
     * Use this capability to enable animations for Android real devices by setting it to true. By default, animations are disabled.
     *
     * Android Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#enableanimations
     */
    enableAnimations?: boolean

    /**
     * Delays system alerts, such as alerts asking for permission to access the camera, to prevent app crashes at startup.
     * resigningEnabled needs to be enabled if this is set to true.
     *
     * iOS Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#systemalertsdelayenabled
     */
    systemAlertsDelayEnabled?: boolean

    /**
     * Specify the amount of time (in milliseconds) that the test should be allowed to find and assign an available device before the test will fail.
     * The default value is 900000 milliseconds (15 minutes) and the max is 1800000 milliseconds (30 minutes).
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#sessioncreationtimeout
     */
    sessionCreationTimeout?: boolean

    /**
     * Specify the amount of automatic retries that Sauce Labs will execute to find and assign an available device before the test will fail.
     * The default value is 1 and the max is 3.
     *
     * Real Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#sessioncreationretry
     */
    sessionCreationRetry?: number

    /**
     * Desktop and Mobile Capabilities: Sauce-Specific – Optional
     * see https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-mobile-capabilities-sauce-specific--optional
     */

    /**
     * Used to record test names for jobs and make it easier to find individual tests.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#name
     */
    name?: string

    /**
     * Used to associate jobs with a build number or app version, which is then displayed
     * on both the Dashboard and Archives view
     *
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#build
     * @example `build-1234`
     */
    build?: string | number

    /**
     * User-defined tags for grouping and filtering jobs in the Dashboard and Archives view.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#tags
     * @example
     * ```
     * ["tag1", "tag2", "tag3"]
     * ```
     */
    tags?: string[]

    /**
     * Sets your Sauce Labs username for a test.
     *
     * You can either set "username" in capabilities or specify it in the Sauce URL as Basic Authentication. For Visual Tests), this must be set in capabilities.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#username
     */
    username?: string

    /**
     * Sets your Sauce Labs access key for the test.
     *
     * You can either set "accessKey" in capabilities or specify it in the Sauce URL as Basic Authentication. For Visual Tests, this must be set in capabilities.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#accesskey
     */
    accessKey?: string

    /**
     * User-defined custom data that will accept any valid JSON object, limited to 64KB in size.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#custom-data
     * @example
     * ```
     * {
     *   "release": "1.0",
     *   "commit": "0k392a9dkjr",
     *   "staging": true,
     *   "execution_number": 5,
     *   "server": "test.customer.com"
     * }
     * ```
     */
    'custom-data'?: any

    /**
     * We support several test/job result visibility levels, which control who can view the test details.
     * The visibility level for a test can be set manually from the test results page, but also programmatically when starting a test or with our REST API.
     * For more information about sharing test results, see the topics under Sharing the Results of Sauce Labs Tests.
     *
     * Desktop and Virtual Devices only.
     *
     * @see https://docs.saucelabs.com/test-results/sharing-test-results/
     */
    public?: 'public' | 'public restricted' | 'share' | 'team' | 'private'

    /**
     * Specify a Sauce Connect tunnel to establish connectivity with Sauce Labs for your test.
     * Tunnels allow you to test an app that is behind a firewall or on your local machine by providing a secure connection to the Sauce Labs platform.
     * @see https://docs.saucelabs.com/secure-connections/sauce-connect/setup-configuration/basic-setup/
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#tunnelname
     */
    tunnelName?: string

    /**
     * Specify a Sauce Connect tunnel name to establish connectivity with a Sauce Labs test platform. This is an alias for tunnelName.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#tunnelidentifier
     * @deprecated
     */
    tunnelIdentifier?: string

    /**
     * If the tunnelName you've specified to establish connectivity with a Sauce Labs test platform is a shared tunnel,
     * and you are not the user who created the tunnel, you must identify the Sauce Labs user who did create the tunnel in order to use it for your test.
     * @see https://docs.saucelabs.com/secure-connections/sauce-connect/setup-configuration/basic-setup/#using-tunnel-names
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#tunnelowner
     */
    tunnelOwner?: string

    /**
     * If the tunnelName (or tunnelIdentifier) you've specified to establish connectivity with a Sauce Labs test platform is a shared tunnel,
     * and you are not the user who created the tunnel, you must identify the Sauce Labs user who did create the tunnel in order to use it for your test.
     * This is an alias for tunnelOwner.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#parenttunnel
     * @deprecated
     */
    parentTunnel?: string

    /**
     * Use this to disable video recording. By default, Sauce Labs records a video of every test you run.
     * Disabling video recording can be useful for debugging failing tests as well as having a visual confirmation that a certain feature works (or still works).
     * However, there is an added wait time for screen recording during a test run.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#recordvideo
     */
    recordVideo?: boolean

    /**
     * Disables video upload for passing tests. videoUploadOnPass is an alternative to recordVideo; it lets you discard videos for tests you've marked as passing.
     * It disables video post-processing and uploading that may otherwise consume some extra time after your test is complete.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#videouploadonpass
     */
    videoUploadOnPass?: boolean

    /**
     * Disables step-by-step screenshots. In addition to capturing video, Sauce Labs captures step-by-step screenshots of every test you run.
     * Most users find it very useful to get a quick overview of what happened without having to watch the complete video.
     * However, this feature may add some extra time to your tests.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#recordscreenshots
     */
    recordScreenshots?: boolean

    /**
     * In the same way Sauce Labs captures step-by-step screenshots, you can capture the HTML source at each step of a test.
     * This feature is disabled by default, but when it is enabled you can view the HTML source captures on the Test Results page.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#capturehtml
     */
    captureHtml?: boolean

    /**
     * Disables log recording. By default, Sauce creates a log of all the actions that you execute to create a report for the test run
     * that lets you troubleshoot test failures more easily.
     * This option disables only the recording of the log.json file; the selenium-server.log will still be recorded.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#recordlogs
     */
    recordLogs?: boolean

    /**
     * Desktop and Virtual Device Capabilities: Sauce-Specific – Optional
     * see https://docs.saucelabs.com/dev/test-configuration-options/#desktop-and-virtual-device-capabilities-sauce-specific--optional
     */

    /**
     * Sets maximum test duration in seconds. As a safety measure to prevent tests from running indefinitely,
     * the default is 1,800 seconds (30 minutes) and the maximum is 10,800 seconds (three hours).
     *
     * Desktop and Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#maxduration
     */
    maxDuration?: number

    /**
     * Setting to prioritize jobs. If you have multiple new jobs waiting to start (i.e., across a collection of sub-accounts),
     * jobs with a lower priority number take precedence over jobs with a higher number.
     *
     * So, for example, if you have multiple jobs simultaneously waiting to start,
     *  we'll first attempt to find resources to start all the jobs with priority 0,then all the jobs with priority 1, etc.
     *
     * When we run out of available virtual machines, or when you hit your concurrency limit, any jobs not yet started will wait.
     * Within each priority level, jobs that have been waiting the longest take precedence.
     *
     * Desktop and Virtual Devices only.
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#priority
     */
    priority?: number

    /**
     * Allows you to set a custom time zone for your test based on a city name. Most major cities are supported.
     *
     * Desktop and Virtual Devices only.
     * @example Los_Angeles
     * @example Honolulu
     * @see https://docs.saucelabs.com/dev/test-configuration-options/#timezone
     */
    timeZone?: string

    /**
     * You can provide a URL to an executable file, which will be downloaded and executed to configure the
     * VM before the test starts. For faster performance, you may want to upload the executable to [Sauce Storage](https://wiki.saucelabs.com/display/DOCS/Uploading+your+Application+to+Emulators+and+Simulators),
     * a private temporary storage space. This capability takes a JSON object with four main keys.
     * Check out the topics under [Using Pre-Run Executables to Configure Browsers and Virtual Machines](https://wiki.saucelabs.com/display/DOCS/Using+Pre-Run+Executables+to+Configure+Browsers+and+Virtual+Machines) for
     * more information.
     *
     * __Running AutoIt Scripts__
     *
     * If you want to run an AutoIt script during your test, compile it as an .exe, send it using this
     * capability, and set background to true to allow AutoIt to continue running throughout the full
     * duration of your test.
     *
     * __Using Multiple Pre-Run Executables__
     *
     * If you need to send multiple pre-run executables, the best way is to bundle them into a single
     * executable file, such as a self-extracting zip file.
     */
    prerun?: {
        executable: string
        args: string[]
        background: boolean
        timeout: number
    }

    recordDeviceVitals?: boolean
}

export interface LambdaTestCapabilities {
    username?: string
    accessKey?: string
    platformName?: string
    deviceName?: string
    platformVersion?: string
    app?: string
    browserName?: string
    browserVersion?: string
    /**
     * Set the resolution of the VM.
     */
    resolution?: string
    selenium_version?: string
    driver_version?: string
    headless?: boolean
    seCdp?: boolean
    /**
     * Specify a name for a logical group of builds.
     */
    project?: string
    /**
     * Specify a name for a logical group of tests.
     */
    build?: string | number
    /**
     * Use this capability to add a custom tag to the builds.
     * These tags can be used to filter the builds on the Automate dashboard.
     */
    buildTags?: Array<string>
    'smartUI.project'?: string
    /**
     * Use this capability to add names to the tests.
     */
    name?: string
    /**
     * Use this capability to add a custom tag to the tests.
     * These tags can be used to filter the tests on the Automate dashboard.
     */
    tags?: Array<string>
    devicelog?: boolean
    visual?: boolean
    video?: boolean
    /**
     * Test locally hosted websites on LambdaTest.
     * To enable access to the local machine you need to setup the
     * LambdaTest Tunnel (https://www.lambdatest.com/support/docs/testing-locally-hosted-pages).
     */
    tunnel?: boolean
    tunnelName?: string
    /**
     * Capture browser console logs at various steps in the test.
     */
    console?: 'warn' | 'error' | 'warn' | 'info' | 'true' | 'false'
    network?: boolean
    timezone?: string
    geoLocation?: string
    location?: {
        lat: string
        long: string
    }
    language?: string
    locale?: string
    idleTimeout?: number
    queueTimeout?: number
    autoGrantPermissions?: boolean
    autoAcceptAlerts?: boolean
    otherApps?: Array<string>
    isRealMobile?: boolean
    networkThrottling?: string,
    deviceOrientation?: 'portrait' | 'landscape'
}

export interface BrowserStackCapabilities {
    browser?: string
    // eslint-disable-next-line
    browser_version?: string
    os?: string
    // eslint-disable-next-line
    os_version?: string
    osVersion?: string
    desired?: unknown
    device?: string
    platformName?: string
    /**
     * Specify a name for a logical group of builds.
     */
    projectName?: string
    /**
     * Specify a name for a logical group of tests.
     */
    buildName?: string
    /**
     * Specify an identifier for the test run.
     */
    sessionName?: string
    /**
     * Test locally hosted websites on BrowserStack.
     * To enable access to the local machine you need to setup the
     * [BrowserStack Local Binary](https://www.browserstack.com/local-testing/automate).
     */
    local?: boolean
    /**
     * Generate screenshots at various steps of the test.
     *
     * @default false
     */
    debug?: boolean
    networkLogs?: boolean
    /**
     * https://www.browserstack.com/docs/app-automate/appium/debug-failed-tests/network-logs
     * Enable viewing the response data in the Network Logs tab on your session
     */
    networkLogsOptions?: {
        captureContent?: boolean
    },
    networkLogsExcludeHosts?: Array<string>
    networkLogsIncludeHosts?: Array<string>
    /**
     * https://www.browserstack.com/docs/app-automate/appium/debug-failed-tests/interactive-session
     * Enable an interactive debugging session while your test session is running
     */
    interactiveDebugging?: boolean,
    seleniumVersion?: string
    seleniumCdp?: boolean,
    ie?: {
        noFlash?: boolean,
        compatibility?: number
        arch?: string
        driver?: string
        enablePopups?: boolean
    }
    userName?: string
    accessKey?: string
    localIdentifier?: string
    /**
     * Capture browser console logs at various steps in the test.
     * Console Logs are available for Selenium tests on Desktop Chrome
     * and Mobile Chrome (Android devices).
     *
     * @default 'errors'
     */
    consoleLogs?: 'disable' | 'errors' | 'warnings' | 'info' | 'verbose'
    appiumLogs?: boolean
    video?: boolean
    seleniumLogs?: boolean
    geoLocation?: string
    timezone?: string
    /**
     * Set the resolution of the VM.
     */
    resolution?: string
    /**
     * Mask the data sent or retrieved by certain commands.
     *
     * Note: Multiple commands can be passed in a single array, separated by commas.
     */
    'browserstack.maskCommands'?: string[]
    /**
     * BrowserStack triggers `BROWSERSTACK_IDLE_TIMEOUT` error when a session
     * is left idle for more than `idleTimeout` seconds. This happens as BrowserStack by
     * default waits for the timeout duration for additional steps or commands
     * to run. If no command is received during that time, the session is stopped,
     * changing the session status to `TIMEOUT` on the Automate dashboard.
     *
     * Valid range: 0-300 seconds.
     *
     * @default 90
     */
    idleTimeout?: number
    /**
     * Mask credentials from test logs if using basic authentication.
     */
    maskBasicAuth?: boolean
    /**
     * Specify a custom delay between the execution of Selenium commands.
     *
     * @default 20
     */
    autoWait?: number
    /**
     * iOS specific. For IOS 13 & above, behavior will flip if popup has more than 2 buttons
     * @see https://www.browserstack.com/docs/app-automate/appium/advanced-features/handle-permission-pop-ups
     */
    autoAcceptAlerts?: boolean
    /**
     * iOS specific. For IOS 13 & above, behavior will flip if popup has more than 2 buttons
     * @see https://www.browserstack.com/docs/app-automate/appium/advanced-features/handle-permission-pop-ups
     */
    autoDismissAlerts?: boolean
    /**
     * Add a host entry (/etc/hosts) to the remote BrowserStack machine.
     *
     * Format: ip_address domain_name
     * @example
     * { "bstack:options": { hosts: "1.2.3.4 staging.website.com" } }
     */
    hosts?: string
    /**
     * IE 11 uses cached pages when navigating using the backward or forward buttons.
     * To disable page caching, set this value to 1.
     *
     * @default 0
     */
    bfcache?: 0 | 1
    /**
     * Enable WSS (WebSocket Secure) connections to work with Network Logs
     * on Chrome v71 and above.
     *
     * Note: if using `localhost` in your test, change it to `bs-local.com`.
     *
     * @default false
     */
    wsLocalSupport?: boolean
    /**
     * Use this capability to disable cross origin restrictions in Safari.
     * Available for Monterey, Big Sur, Catalina and Mojave.
     *
     * @default false
     */
    disableCorsRestrictions?: boolean
    /**
     * Use this capability to add a custom tag to the builds.
     * These tags can be used to filter the builds on the Automate dashboard.
     */
    buildTag?: string
    /**
     * Specify a particular mobile device for the test environment.
     */
    deviceName?: string
    /**
     * Use this flag to test on a physical mobile device.
     *
     * @default false
     */
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
    }
    firefox?: {
        driver?: string
    }
    browserName?: string
    browserVersion?: string
    /**
     * Ignore invalid certificate errors.
     *
     * @default false
     */
    acceptSslCerts?: boolean
    /**
     * @private
     */
    wdioService?: string
    /**
     * Specify an identifier for a build consists group of tests.
     */
    buildIdentifier?: string

    accessibility?: boolean
    accessibilityOptions?: { [key: string]: any }

    'browserstack.buildIdentifier'?: string
    'browserstack.localIdentifier'?: string
    'browserstack.accessibility'?: boolean
    'browserstack.accessibilityOptions'?: { [key: string]: any }

    appStoreConfiguration?: { username: string, password: string }
    gpsLocation?: string
    disableAnimations?: boolean
    midSessionInstallApps?: Array<string>
    uploadMedia?: Array<string>
    enablePasscode?: boolean
    deviceLogs?: boolean,

    /**
     * Disable re-signing of Enterprise signed app uploaded on BrowserStack
     * @default true
     */
    resignApp?: boolean,

    /**
     * Hides data that you send to or retrieve from the remote browsers through the following commands:
     * Example: 'setValues, getValues, setCookies, getCookies'
     */
    maskCommands?: string,

    testhubBuildUuid?: string,
    buildProductMap?: { [key: string]: boolean }
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
    appiumVersion?: string
    appiumPlugins?: string[]
    name?: string
    tags?: string[]
    build?: string | number
    public?: boolean
    'tunnel-identifier'?: string
    realDevice?: boolean
    'selenium-version'?: string
    chromedriverVersion?: string
    iedriverVersion?: string
    edgedriverVersion?: string
    geckodriverVersion?: string
    operaDriverVersion?: string
    // prerun?: any
    'screen-resolution'?: string
    timeZone?: string
    'throttle_network'?: any
    tabletOnly?: boolean
    phoneOnly?: boolean
    recordLogs?: boolean
    screenshot?: boolean
    screenrecorder?: boolean
    maxDuration?: number
    upload?: string
    'testingbot.geoCountryCode'?: string
    idletimeout?: number
    'load-extension'?: string
}
