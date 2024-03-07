import type {
    WebdriverIO as WebDriverIOOptions,
    Connection as ConnectionOptions
} from './Options.js'

type JSONLike = | { [property: string]: JSONLike } | readonly JSONLike[] | string | number | boolean | null

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

export type RemoteCapabilities = (DesiredCapabilities | W3CCapabilities)[] | MultiRemoteCapabilities | MultiRemoteCapabilities[]

export interface MultiRemoteCapabilities {
    [instanceName: string]: WebDriverIOOptions
}

export type RemoteCapability = DesiredCapabilities | W3CCapabilities | MultiRemoteCapabilities

/**
 * @deprecated use `WebdriverIO.Capabilities` instead
 */
export interface DesiredCapabilities extends WebdriverIO.Capabilities, SauceLabsCapabilities, SauceLabsVisualCapabilities,
    TestingbotCapabilities, SeleniumRCCapabilities, GeckodriverCapabilities, IECapabilities,
    AppiumAndroidCapabilities, AppiumCapabilities, VendorExtensions, GridCapabilities,
    ChromeCapabilities, BrowserStackCapabilities, AppiumXCUITestCapabilities, LambdaTestCapabilities {

    // Read-only capabilities
    cssSelectorsEnabled?: boolean
    handlesAlerts?: boolean
    version?: string
    platform?: string
    public?: any

    loggingPrefs?: {
        browser?: LoggingPreferences
        driver?: LoggingPreferences
        server?: LoggingPreferences
        client?: LoggingPreferences
    }

    // Read-write capabilities
    javascriptEnabled?: boolean
    databaseEnabled?: boolean
    locationContextEnabled?: boolean
    applicationCacheEnabled?: boolean
    browserConnectionEnabled?: boolean
    webStorageEnabled?: boolean
    acceptSslCerts?: boolean
    rotatable?: boolean
    nativeEvents?: boolean
    unexpectedAlertBehaviour?: string
    elementScrollBehavior?: number

    // RemoteWebDriver specific
    'webdriver.remote.sessionid'?: string
    'webdriver.remote.quietExceptions'?: boolean

    // Selenese-Backed-WebDriver specific
    'selenium.server.url'?: string

    // webdriverio specific
    specs?: string[]
    exclude?: string[]
    excludeDriverLogs?: string[]
}

export interface VendorExtensions extends EdgeCapabilities, AppiumCapabilities, WebdriverIO.WDIODevtoolsOptions, WebdriverIOCapabilities, WebdriverIO.WDIOVSCodeServiceOptions {
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

    'goog:chromeOptions'?: ChromeOptions
    'moz:firefoxOptions'?: FirefoxOptions
    // This capability is a boolean when send as part of the capabilities to Geckodriver
    // and is being returns as string (e.g. "<host>:<port>") when session capabilities
    // are returned from the driver
    // see https://firefox-source-docs.mozilla.org/testing/geckodriver/Capabilities.html#moz-debuggeraddress
    'moz:debuggerAddress'?: string | number
    // eslint-disable-next-line
    firefox_profile?: string
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
    /**
     * @deprecated
     */
    // eslint-disable-next-line
    testobject_api_key?: string
}

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
     * Maximum number of total parallel running workers (per capability)
     * @deprecated please use `wdio:maxInstances` instead
     */
    maxInstances?: number

    /**
    * Define specs for test execution. You can either specify a glob
    * pattern to match multiple files at once or wrap a glob or set of
    * paths into an array to run them within a single worker process.
    */
    'wdio:specs'?: string[]
    /**
     * Define specs for test execution. You can either specify a glob
     * pattern to match multiple files at once or wrap a glob or set of
     * paths into an array to run them within a single worker process.
     * @deprecated please use `wdio:specs` instead
     */
    specs?: string[]

    /**
     * Exclude specs from test execution.
     */
    'wdio:exclude'?: string[]
    /**
     * Exclude specs from test execution.
     * @deprecated please use `wdio:exclude` instead
     */
    exclude?: string[]
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

export interface GeckodriverCapabilities {
    'firefox_binary'?: string
    firefoxProfileTemplate?: string
    captureNetworkTraffic?: boolean
    addCustomRequestHeaders?: boolean
    trustAllSSLCertificates?: boolean
    changeMaxConnections?: boolean
    profile?: string
    pageLoadingStrategy?: string
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

// Selenium Grid specific
export interface GridCapabilities {
    // Grid-specific
    seleniumProtocol?: string
    maxInstances?: number
    environment?: string
}

// Edge specific
export interface EdgeCapabilities {
    'ms:inPrivate'?: boolean
    'ms:extensionPaths'?: string[]
    'ms:startPage'?: string
}

// Chrome specific
export interface ChromeCapabilities {
    chromeOptions?: ChromeOptions
    mobileEmulationEnabled?: boolean
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

// IE specific
export interface IECapabilities {
    'ie.forceCreateProcessApi'?: boolean
    'ie.browserCommandLineSwitches'?: string
    'ie.usePerProcessProxy'?: boolean
    'ie.ensureCleanSession'?: boolean
    'ie.setProxyByServer'?: boolean
    'ie.fileUploadDialogTimeout'?: number
    'ie.edgechromium'?: boolean
    'ie.edgepath'?: string
    ignoreProtectedModeSettings?: boolean
    ignoreZoomSetting?: boolean
    initialBrowserUrl?: string
    enablePersistentHover?: boolean
    enableElementCacheCleanup?: boolean
    requireWindowFocus?: boolean
    browserAttachTimeout?: number
    logFile?: string
    logLevel?: string
    host?: string
    extractPath?: string
    silent?: string
    killProcessesByName?: boolean
}

/**
 * see also https://docs.saucelabs.com/dev/test-configuration-options
 */
export interface SauceLabsCapabilities {
    /**
     * Used to record test names for jobs and make it easier to find individual tests.
     */
    name?: string
    /**
     * Used to associate jobs with a build number or app version, which is then displayed
     * on both the Dashboard and Archives view
     *
     * @example `build-1234`
     */
    build?: string | number
    /**
     * User-defined tags for grouping and filtering jobs in the Dashboard and Archives view.
     * @example
     * ```
     * ["tag1", "tag2", "tag3"]
     * ```
     */
    tags?: string[]
    /**
     * User-defined custom data that will accept any valid JSON object, limited to 64KB in size.
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
     * If you are using Sauce Connect Proxy to to test an application that is behind a firewall
     * or on your local machine, you must provide the identifier of the Sauce Connect tunnel to
     * use. Check out [Basic Sauce Connect Proxy Setup](https://wiki.saucelabs.com/display/DOCS/Basic+Sauce+Connect+Proxy+Setup) for more information.
     */
    tunnelIdentifier?: string
    /**
     * This desired capability will let the test job use any shared tunnels available from the
     * specified parent account. i.e. any account that is upstream in the hierarchy. __If using a
     * shared tunnel, you must specify both tunnelIdentifier and parentTunnel__. Check out the
     * topic Using [Sauce Connect Tunnel Identifiers](https://wiki.saucelabs.com/display/DOCS/Using+Sauce+Connect+Tunnel+Identifiers) for more information.
     */
    parentTunnel?: string
    /**
     * This setting specifies which screen resolution should be used during the test session.
     *
     * @example `1280x1024`
     */
    screenResolution?: string
    /**
     * Desktop Test VMs can be configured with custom time zones. This feature should work on all operating
     * systems, however time zones on Windows VMs are approximate. The time zone will usually default to
     * whatever local time zone is on your selected data center, but this cannot be guaranteed. You can
     * find a complete list of timezones on Wikipedia. If the timeZone name has two or more or words
     * (e.g., Los Angeles), you'll need to separate the words with either a space or an underscore. Sauce
     * takes only location names (not their paths), as shown in the example below.
     *
     * @example Los_Angeles
     * @example Honolulu
     */
    timeZone?: string
    /**
     * By default, Sauce routes traffic from some WebDriver browsers (Edge, Internet Explorer and Safari)
     * through the Selenium HTTP proxy server so that HTTPS connections with self-signed certificates
     * work everywhere. The Selenium proxy server can cause problems for some users. If that's the case
     * for you, you can configure Sauce to avoid using the proxy server and have browsers communicate
     * directly with your servers.
     *
     * __Don't Need the Selenium Proxy with Firefox or Google Chrome__
     *
     * Firefox and Google Chrome under WebDriver aren't affected by this flag as they handle invalid
     * certificates automatically and there isn't a need to proxy through Selenium.
     *
     * __Incompatible with Sauce Connect Proxy__
     *
     * This flag is incompatible with Sauce Connect Proxy.
     */
    avoidProxy?: boolean
    /**
     * Sauce Labs supports several test result visibility levels, which control who can view the test
     * details. The visibility level for a test can be set manually from the test results page, but
     * also programmatically when starting a test or with our REST API. For more information about
     * sharing test result, see the topics under Sharing the Results of Sauce Labs Tests.
     *
     * Available visibility levels are:
     *
     * - __public__: Making your test public means that it is accessible to everyone, and may be
     *   listed on public web pages and indexed by search engines.
     * - __public restricted__: If you want to share your job's result page and video, but keep
     *   the logs only for you, you can certainly do so with public restricted visibility mode. This
     *   visibility mode will hide the fancy job log as well as prohibit access to the raw Selenium log,
     *   so that anonymous users with the link will be able to watch the video and screen shots but
     *   won't be able to see what's being typed and done to get there.
     * - __share__: You can also decide to make your test sharable. Making your test sharable means
     *   that it is only accessible to people having valid link and it is not listed on publicly available
     *   pages on saucelabs.com or indexed by search engines.
     * - __team__: If you want to share your jobs with other team members (that were created as a sub-accounts
     *   of one parent account), you can use team visibility mode. Making your test accessible by team means
     *   that it is only accessible to people under the same root account as you.
     * - __private__: If you don't want to share your test's result page and video with anyone, you should
     *   use private job visibility mode. This way, only you (the owner) will be able to view assets and test
     *   result page.
     *
     * @default private
     */
    public?: 'public' | 'public restricted' | 'share' | 'team' | 'private'
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
    /**
     * By default, Sauce Labs records a video of every test you run. This is generally handy for debugging
     * failing tests, as well as having a visual confirmation that certain feature works (or still works!)
     * However, there is an added wait time for screen recording during a test run.
     */
    recordVideo?: boolean
    /**
     * As an alternative to disabling video recording, the  videoUploadOnPass  setting will let you
     * discard videos for passing tests identified using the passed setting. This disables video
     * post-processing and uploading that may otherwise consume some extra time after your test is complete.
     */
    videoUploadOnPass?: boolean
    /**
     * Sauce Labs captures step-by-step screenshots of every test you run. Most users find it very
     * useful to get a quick overview of what happened without having to watch the complete video.
     * However, this feature may add some extra time to your tests. You can avoid this by optionally
     * turning off this feature.
     */
    recordScreenshots?: boolean
    /**
     * By default, Sauce creates a log of all the actions that you execute to create a report for the
     * test run that lets you troubleshoot test failures more easily.
     *
     * __Note:__ Selenium Logs Are Still Recorded
     *
     * This option only disables recording of the log.json file. The selenium-server.log will still be
     * recorded even if you choose to disable recording of the log.json.
     */
    recordLogs?: boolean
    /**
     * If you have multiple new jobs waiting to start (i.e., across a collection of sub-accounts), jobs
     * with a lower priority number take precedence over jobs with a higher number. So, for example, if
     * you have multiple jobs simultaneously waiting to start, we'll first attempt to find resources to
     * start all the jobs with priority 0, then all the jobs with priority 1, etc. When we run out of
     * available virtual machines, or when you hit your concurrency limit, any jobs not yet started will
     * wait. Within each priority level, jobs that have been waiting the longest take precedence.
     *
     * @default 0
     */
    priority?: number
    /**
     * Enable [Extended Debugging Capabilities](https://wiki.saucelabs.com/pages/viewpage.action?pageId=70072943).
     *
     * @default false
     */
    extendedDebugging?: boolean
    /**
     * Enable [Frontend Performance](https://wiki.saucelabs.com/display/DOCS/Measure+Page+Load+Performance+Using+Test+Automation) capturing capabilities.
     */
    capturePerformance?: boolean
    /**
     * We do not recommend to use this option.
     * @deprecated
     */
    seleniumVersion?: string
    /**
     * Chromedriver versions are pinned to the Chrome version you have defined in your capabilities.
     * Only define a custom `chromedriverVersion` if you know what you do.
     *
     * @deprecated
     */
    chromedriverVersion?: string
    /**
     * The Internet Explorer Driver defaults to version 2.53.1 when no version is specified.
     *
     * Note that the versions of Internet Explorer Driver we have available correspond to major Selenium
     * releases - we do not have all the minor point releases (e.g. 3.12.0.4) available.
     *
     * We recommend setting the Selenium Version (see above) to correspond with the Internet Explorer Driver
     * version you select.
     *
     * Sauce Labs supports launching 64-bit IE on our 64-bit VMs: Windows 7, Windows 8, and Windows 8.1.
     * This provides a workaround for two known Selenium issues:
     * - Using a 32 bit driver on a 64 bit operating system causes Selenium's screenshot feature to only
     *   capture the part of the page currently visible in the browser viewport Selenium Issue 5876.
     * - Using a 64 bit driver on a 64 bit operating system causes text entry to be extremely slow
     *   Selenium Issue 5516.
     *
     * @deprecated
     */
    iedriverVersion?: string
    /**
     * For Firefox version 80 and above, geckodriver defaults to latest driver version 0.27.0 when no
     * version is specified.
     *
     * @deprecated
     */
    geckodriverVersion?: string
    /**
     * As a safety measure to prevent tests from running indefinitely, Sauce limits the duration of
     * tests to 30 minutes by default. You can adjust this limit on per-job basis and the maximum
     * value is 10800 seconds.
     *
     * __Don't Exceed 30 Minutes__
     *
     * A test should never last more than 30 minutes and ideally should take less than five minutes.
     * The 3 hour maximum exists mainly to ease the transition of new users migrating long running
     * tests to Sauce Labs.
     *
     * While our test VMs respect the maxDuration desired capability when it's set in tests, it may
     * not always be precise. Tests will never be timed out before their maxDuration has elapsed and
     * in most cases, they will be timed out very shortly after their maxDuration has elapsed (usually
     * less than 1 second). But, in some rare cases, such as when the test VM is suffering performance
     * problems, they can be allowed to run longer (30 seconds or more).
     *
     * @default 1800
     */
    maxDuration?: number
    /**
     * As a safety measure to prevent Selenium crashes from making your tests run indefinitely, Sauce
     * limits how long Selenium can take to run a command in our browsers. This is set to 300 seconds
     * by default. The value of this setting is given in seconds. The maximum command timeout value
     * allowed is 600 seconds.
     *
     * @default 300
     */
    commandTimeout?: number
    /**
     * As a safety measure to prevent tests from running too long after something has gone wrong, Sauce
     * limits how long a browser can wait for a test to send a new command. This is set to 90 seconds
     * by default and limited to a maximum value of 1000 seconds. You can adjust this limit on a per-job
     * basis. The value of this setting is given in seconds.
     *
     * @default 90
     */
    idleTimeout?: number
    /**
     * Enables the interception of biometric input, allowing the test to
     * simulate Touch ID interactions (not a Sauce Labs-specific capability).
     *
     * @default false
     */
    allowTouchIdEnroll?: boolean
    /**
     * Keeps a device allocated to you between test sessions, bypassing the
     * device cleaning process and session exit that occurs by default after
     * each test completes. Normally, you'd need to start over and reopen
     * another device. You'll need to launch your next test within 10 seconds
     * of your previous test ending to ensure that the same device will be
     * allocated for the test (not cleaned or reset).
     *
     * @default *randomized string*
     */
    cacheId?: string
    /**
     * Specifies the Appium driver version you want to use. For most use cases,
     * setting the appiumVersion is unnecessary because Sauce Labs defaults to
     * the version that supports the broadest number of device combinations.
     * Sauce Labs advises against setting this property unless you need to test
     * a particular Appium feature or patch.
     */
    appiumVersion?: string
    /**
     * Controls Sauce Labs default resigning (iOS) or instrumentation (Android)
     * of mobile apps installed on our devices.
     * @default true
     */
    resigningEnabled?: boolean;
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
    desired?: DesiredCapabilities
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
    deviceLogs?: boolean
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
    name?: string
    tags?: string[]
    build?: string | number | number
    public?: boolean
    'tunnel-identifier'?: string
    realDevice?: boolean
    'selenium-version'?: string
    chromedriverVersion?: string
    iedriverVersion?: string
    edgedriverVersion?: string
    geckodriverVersion?: string
    operaDriverVersion?: string
    timeZone?: string
    upload?: string
    'testingbot.geoCountryCode'?: string
    idletimeout?: number
    'load-extension'?: string
}

export interface SeleniumRCCapabilities {
    // Selenium RC (1.0) only
    commandLineFlags?: string
    executablePath?: string
    timeoutInSeconds?: number
    onlyProxySeleniumTraffic?: boolean
    avoidProxy?: boolean
    proxyEverything?: boolean
    proxyRequired?: boolean
    browserSideLog?: boolean
    optionsSet?: boolean
    singleWindow?: boolean
    dontInjectRegex?: RegExp
    userJSInjection?: boolean
    userExtensions?: string
}
