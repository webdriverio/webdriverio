const MOBILE_BROWSER_NAMES = ['ipad', 'iphone', 'android']
const MOBILE_CAPABILITIES = [
    'appium-version', 'appiumVersion', 'device-type', 'deviceType',
    'device-orientation', 'deviceOrientation', 'deviceName'
]

/**
 * check if session is based on W3C protocol based on the /session response
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if W3C (browser)
 */
export function isW3C (capabilities?: WebDriver.DesiredCapabilities) {
    /**
     * JSONWire protocol doesn't return a property `capabilities`.
     * Also check for Appium response as it is using JSONWire protocol for most of the part.
     */
    if (!capabilities) {
        return false
    }

    /**
     * assume session to be a WebDriver session when
     * - capabilities are returned
     *   (https://w3c.github.io/webdriver/#dfn-new-sessions)
     * - it is an Appium session (since Appium is full W3C compliant)
     */
    const isAppium = Boolean(
        capabilities.automationName ||
        capabilities.deviceName ||
        capabilities.appiumVersion
    )
    const hasW3CCaps = Boolean(
        capabilities.platformName &&
        capabilities.browserVersion &&
        /**
         * local safari and BrowserStack don't provide platformVersion therefor
         * check also if setWindowRect is provided
         */
        (capabilities.platformVersion || Object.prototype.hasOwnProperty.call(capabilities, 'setWindowRect'))
    )
    return Boolean(hasW3CCaps || isAppium)
}

/**
 * check if session is run by Chromedriver
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run by Chromedriver
 */
function isChrome (capabilities?: WebDriver.DesiredCapabilities) {
    if (!capabilities) {
        return false
    }
    return Boolean(capabilities.chrome || capabilities['goog:chromeOptions'])
}

/**
 * check if current platform is mobile device
 *
 * @param  {Object}  caps  capabilities
 * @return {Boolean}       true if platform is mobile device
 */
function isMobile (capabilities?: WebDriver.Capabilities) {
    if (!capabilities) {
        return false
    }
    const browserName = (capabilities.browserName || '').toLowerCase()

    /**
     * we have mobile capabilities if
     */
    return Boolean(
        /**
         * capabilities contain mobile only specific capabilities
         */
        Object.keys(capabilities).find((cap) => MOBILE_CAPABILITIES.includes(cap)) ||
        /**
         * browserName is empty (and eventually app is defined)
         */
        capabilities.browserName === '' ||
        /**
         * browserName is a mobile browser
         */
        MOBILE_BROWSER_NAMES.includes(browserName)
    )
}

/**
 * check if session is run on iOS device
 * @param  {Object}  capabilities  of session response
 * @return {Boolean}               true if run on iOS device
 */
function isIOS (capabilities?: WebDriver.DesiredCapabilities) {
    if (!capabilities) {
        return false
    }

    return Boolean(
        (capabilities.platformName && capabilities.platformName.match(/iOS/i)) ||
        (capabilities.deviceName && capabilities.deviceName.match(/(iPad|iPhone)/i))
    )
}

/**
 * check if session is run on Android device
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run on Android device
 */
function isAndroid (capabilities?: WebDriver.Capabilities) {
    if (!capabilities) {
        return false
    }

    return Boolean(
        (capabilities.platformName && capabilities.platformName.match(/Android/i)) ||
        (capabilities.browserName && capabilities.browserName.match(/Android/i))
    )
}

/**
 * detects if session is run on Sauce with extended debugging enabled
 * @param  {string}  hostname     hostname of session request
 * @param  {object}  capabilities session capabilities
 * @return {Boolean}              true if session is running on Sauce with extended debugging enabled
 */
function isSauce (capabilities?: WebDriver.DesiredCapabilities | WebDriver.W3CCapabilities) {
    if (!capabilities) {
        return false
    }

    const caps: WebDriver.DesiredCapabilities = (capabilities as WebDriver.W3CCapabilities).alwaysMatch
        ? (capabilities as WebDriver.W3CCapabilities).alwaysMatch
        : capabilities as WebDriver.DesiredCapabilities

    return Boolean(
        caps.extendedDebugging ||
        (
            caps['sauce:options'] &&
            caps['sauce:options'].extendedDebugging
        )
    )
}

/**
 * detects if session is run using Selenium Standalone server
 * @param  {object}  capabilities session capabilities
 * @return {Boolean}              true if session is run with Selenium Standalone Server
 */
function isSeleniumStandalone (capabilities?: WebDriver.DesiredCapabilities) {
    if (!capabilities) {
        return false
    }
    return Boolean(capabilities['webdriver.remote.sessionid'])
}

/**
 * returns information about the environment before the session is created
 * @param  {Object}  capabilities           caps provided by user
 * @param  {string=} automationProtocol     `devtools`
 * @return {Object}                         object with environment flags
 */
export function capabilitiesEnvironmentDetector (capabilities: WebDriver.Capabilities, automationProtocol: string) {
    return automationProtocol === 'devtools'
        ? devtoolsEnvironmentDetector(capabilities)
        : webdriverEnvironmentDetector(capabilities)
}

/**
 * returns information about the environment when the session is created
 * @param  {Object}  capabilities           caps of session response
 * @param  {Object}  requestedCapabilities
 * @return {Object}                         object with environment flags
 */
export function sessionEnvironmentDetector ({ capabilities, requestedCapabilities }: { capabilities?: WebDriver.DesiredCapabilities, requestedCapabilities?: WebDriver.DesiredCapabilities | WebDriver.W3CCapabilities }) {
    return {
        isW3C: isW3C(capabilities),
        isChrome: isChrome(capabilities),
        isMobile: isMobile(capabilities),
        isIOS: isIOS(capabilities),
        isAndroid: isAndroid(capabilities),
        isSauce: isSauce(requestedCapabilities),
        isSeleniumStandalone: isSeleniumStandalone(capabilities)
    }
}

/**
 * returns information about the environment when `devtools` protocol is used
 * @param  {Object}  capabilities           caps of session response
 * @return {Object}                         object with environment flags
 */
export function devtoolsEnvironmentDetector ({ browserName }: WebDriver.Capabilities) {
    return {
        isDevTools: true,
        isW3C: true,
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        isChrome: browserName === 'chrome',
        isSauce: false,
        isSeleniumStandalone: false,
    }
}

/**
 * returns information about the environment before the session is created
 * `isW3C`, `isSeleniumStandalone` cannot be detected
 * @param  {Object}  capabilities           caps provided by user
 * @return {Object}                         object with environment flags
 */
export function webdriverEnvironmentDetector (capabilities: WebDriver.Capabilities) {
    return {
        isChrome: isChrome(capabilities),
        isMobile: isMobile(capabilities),
        isIOS: isIOS(capabilities),
        isAndroid: isAndroid(capabilities),
        isSauce: isSauce(capabilities)
    }
}
