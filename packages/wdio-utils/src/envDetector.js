const MOBILE_BROWSER_NAMES = ['ipad', 'iphone', 'android']
const CHROMIUM_BROWSER_NAMES = ['chrome', 'msedge', 'MicrosoftEdge']
const MOBILE_CAPABILITIES = [
    'appium-version', 'appiumVersion', 'device-type', 'deviceType',
    'device-orientation', 'deviceOrientation', 'deviceName'
]

/**
 * check if session is based on W3C protocol based on the /session response
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if W3C (browser)
 */
function isW3C (capabilities) {
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
    const isAppium = capabilities.automationName || capabilities.deviceName || (capabilities.appiumVersion)
    const hasW3CCaps = (
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
 * check if session is run by a chromium based driver (chromedriver, msedgedriver)
 * @param  {Object}  capabilities  capabilities of session response
 * @return {Boolean}               true if run by chromium based driver
 */
function isChromium (capabilities) {
    if (!capabilities) {
        return false
    }
    return (
        CHROMIUM_BROWSER_NAMES.includes(capabilities.browserName) ||
        Boolean(capabilities['goog:chromeOptions'] || capabilities['ms:edgeOptions'])
    )
}

/**
 * check if current platform is mobile device
 * @return {Boolean}       true if platform is mobile device
 * @param capabilities
 */
function isMobile (capabilities) {
    if (!capabilities) {
        return false
    }
    const browserName = (capabilities.browserName || '').toLowerCase()

    /**
     * we have mobile caps if
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
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run on iOS device
 */
function isIOS (capabilities) {
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
function isAndroid (capabilities) {
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
 * @param  {object}  capabilities session capabilities
 * @return {Boolean}              true if session is running on Sauce with extended debugging enabled
 */
function isSauce (capabilities) {
    return Boolean(
        capabilities.extendedDebugging ||
        (
            capabilities['sauce:options'] &&
            capabilities['sauce:options'].extendedDebugging
        )
    )
}

/**
 * detects if session is run using Selenium Standalone server
 * @param  {object}  capabilities session capabilities
 * @return {Boolean}              true if session is run with Selenium Standalone Server
 */
function isSeleniumStandalone (capabilities) {
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
export function capabilitiesEnvironmentDetector (capabilities, automationProtocol) {
    return automationProtocol === 'devtools' ? devtoolsEnvironmentDetector(capabilities) : webdriverEnvironmentDetector(capabilities)
}

/**
 * returns information about the environment when the session is created
 * @param  {Object}  capabilities           caps of session response
 * @param  {Object}  requestedCapabilities
 * @return {Object}                         object with environment flags
 */
export function sessionEnvironmentDetector ({ capabilities, requestedCapabilities }) {
    return {
        isW3C: isW3C(capabilities),
        isChromium: isChromium(capabilities),
        isMobile: isMobile(capabilities),
        isIOS: isIOS(capabilities),
        isAndroid: isAndroid(capabilities),
        isSauce: isSauce(requestedCapabilities.w3cCaps.alwaysMatch),
        isSeleniumStandalone: isSeleniumStandalone(capabilities)
    }
}

/**
 * returns information about the environment when `devtools` protocol is used
 * @param  {Object}  capabilities           caps of session response
 * @return {Object}                         object with environment flags
 */
export function devtoolsEnvironmentDetector (capabilities) {
    return {
        isDevTools: true,
        isW3C: true,
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        isChromium: isChromium(capabilities),
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
export function webdriverEnvironmentDetector (capabilities) {
    return {
        isChromium: isChromium(capabilities),
        isMobile: isMobile(capabilities),
        isIOS: isIOS(capabilities),
        isAndroid: isAndroid(capabilities),
        isSauce: isSauce(capabilities)
    }
}
