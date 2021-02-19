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

export interface VendorExtensions extends EdgeCapabilities, AppiumW3CCapabilities, WebdriverIO.WDIODevtoolsOptions {
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
