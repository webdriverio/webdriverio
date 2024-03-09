import type { Capabilities } from '@wdio/types'
import { SUPPORTED_BROWSERNAMES } from './constants.js'

const MOBILE_BROWSER_NAMES = ['ipad', 'iphone', 'android']
const MOBILE_CAPABILITIES = [
    'appium-version', 'appiumVersion', 'device-type', 'deviceType', 'app', 'appArguments',
    'device-orientation', 'deviceOrientation', 'deviceName', 'automationName'
]

/**
 * check if session is based on W3C protocol based on the /session response
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if W3C (browser)
 */
export function isW3C(capabilities?: Capabilities.DesiredCapabilities) {
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
        // @ts-expect-error outdated jsonwp cap
        capabilities.automationName ||
        capabilities['appium:automationName'] ||
        capabilities.deviceName ||
        capabilities.appiumVersion
    )
    const hasW3CCaps = Boolean(
        /**
         * safari docker image may not provide a platformName therefore
         * check one of the available "platformName" or "browserVersion"
         */
        (capabilities.platformName || capabilities.browserVersion) &&
        /**
         * local safari and BrowserStack don't provide platformVersion therefore
         * check also if setWindowRect is provided
         */
        (
            capabilities.platformVersion ||
            capabilities['appium:platformVersion'] ||
            Object.prototype.hasOwnProperty.call(capabilities, 'setWindowRect')
        )
    )
    const hasWebdriverFlag = Boolean(capabilities['ms:experimental-webdriver'])
    return Boolean(hasW3CCaps || isAppium || hasWebdriverFlag)
}

/**
 * check if session is run by Chromedriver
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run by Chromedriver
 */
function isChrome(capabilities?: Capabilities.DesiredCapabilities) {
    if (!capabilities) {
        return false
    }
    return Boolean(capabilities.chrome || capabilities['goog:chromeOptions'])
}

/**
 * check if session is run by Edgedriver
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run by Edgedriver
 */
function isEdge(capabilities?: Capabilities.DesiredCapabilities) {
    if (!capabilities) {
        return false
    }
    return (
        Boolean(capabilities.browserName && SUPPORTED_BROWSERNAMES.edge.includes(capabilities.browserName.toLowerCase()) ||
          capabilities['ms:edgeOptions'])
    )
}

/**
 * check if session is run by Geckodriver
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run by Geckodriver
 */
function isFirefox(capabilities?: Capabilities.DesiredCapabilities) {
    if (!capabilities) {
        return false
    }
    return (
        capabilities.browserName === 'firefox' ||
        Boolean(Object.keys(capabilities).find((cap) => cap.startsWith('moz:')))
    )
}

/**
 * check if current platform is mobile device
 *
 * @param  {Object}  caps  capabilities
 * @return {Boolean}       true if platform is mobile device
 */
function isMobile(capabilities: WebdriverIO.Capabilities) {
    const browserName = (capabilities.browserName || '').toLowerCase()
    const bsOptions = capabilities['bstack:options'] || {}
    const browserstackBrowserName = (bsOptions.browserName || '').toLowerCase()
    /**
     * we have mobile capabilities if
     */
    return Boolean(
        /**
         * If the device is ios, tvos or android, the device might be mobile.
         */
        capabilities.platformName && capabilities.platformName.match(/ios/i) ||
        capabilities.platformName && capabilities.platformName.match(/tvos/i) ||
        capabilities.platformName && capabilities.platformName.match(/android/i) ||
        /ios/i.test(bsOptions.platformName || '') ||
        /tvos/i.test(bsOptions.platformName || '') ||
        /android/i.test(bsOptions.platformName || '') ||
        /**
         * capabilities contain mobile only specific capabilities
         */
        Object.keys(capabilities).find((cap) => (
            MOBILE_CAPABILITIES.includes(cap) ||
            MOBILE_CAPABILITIES.map((c) => `appium:${c}`).includes(cap)
        )) ||
        /**
         * browserName is empty (and eventually app is defined)
         */
        capabilities.browserName === '' ||
        bsOptions.browserName === '' ||
        /**
         * browserName is a mobile browser
         */
        MOBILE_BROWSER_NAMES.includes(browserName) ||
        MOBILE_BROWSER_NAMES.includes(browserstackBrowserName)
    )
}

/**
 * check if session is run on iOS device
 * @param  {Object}  capabilities  of session response
 * @return {Boolean}               true if run on iOS device
 */
function isIOS(capabilities?: Capabilities.DesiredCapabilities) {
    const bsOptions = capabilities?.['bstack:options'] || {}
    if (!capabilities) {
        return false
    }

    return Boolean(
        (capabilities.platformName && capabilities.platformName.match(/iOS/i)) ||
        (capabilities.deviceName && capabilities.deviceName.match(/(iPad|iPhone)/i)) ||
        (/iOS/i.test(bsOptions.platformName || '')) ||
        (/(iPad|iPhone)/i.test(bsOptions.deviceName || ''))
    )
}

/**
 * check if session is run on Android device
 * @param  {Object}  capabilities  caps of session response
 * @return {Boolean}               true if run on Android device
 */
function isAndroid(capabilities?: WebdriverIO.Capabilities) {
    const bsOptions = capabilities?.['bstack:options'] || {}
    if (!capabilities) {
        return false
    }

    return Boolean(
        (capabilities.platformName && capabilities.platformName.match(/Android/i)) ||
        (/Android/i.test(bsOptions.platformName || '')) ||
        (/Android/i.test(bsOptions.browserName || '')) ||
        (capabilities.browserName && capabilities.browserName.match(/Android/i))
    )
}

/**
 * detects if session is run on Sauce with extended debugging enabled
 * @param  {object}  capabilities session capabilities
 * @return {Boolean}              true if session is running on Sauce with extended debugging enabled
 */
function isSauce(capabilities?: Capabilities.RemoteCapability) {
    if (!capabilities) {
        return false
    }

    const caps: Capabilities.DesiredCapabilities = (capabilities as Capabilities.W3CCapabilities).alwaysMatch
        ? (capabilities as Capabilities.W3CCapabilities).alwaysMatch
        : capabilities as Capabilities.DesiredCapabilities

    return Boolean(
        caps.extendedDebugging ||
        (
            caps['sauce:options'] &&
            caps['sauce:options'].extendedDebugging
        )
    )
}

/**
 * detects if session has support for WebDriver Bidi
 * @param  {object}  capabilities session capabilities
 * @return {Boolean}              true if session has WebDriver Bidi support
 */
function isBidi(capabilities?: Capabilities.RemoteCapability) {
    if (!capabilities) {
        return false
    }

    const caps: Capabilities.DesiredCapabilities = (capabilities as Capabilities.W3CCapabilities).alwaysMatch
        ? (capabilities as Capabilities.W3CCapabilities).alwaysMatch
        : capabilities as Capabilities.DesiredCapabilities

    return Boolean(caps.webSocketUrl)
}

/**
 * detects if session is run using Selenium Standalone server
 * @param  {object}  capabilities session capabilities
 * @return {Boolean}              true if session is run with Selenium Standalone Server
 */
function isSeleniumStandalone(capabilities?: Capabilities.DesiredCapabilities) {
    if (!capabilities) {
        return false
    }
    return (
        /**
         * Selenium v3 and below
         */
        Boolean(capabilities['webdriver.remote.sessionid']) ||
        /**
         * Selenium v4 and up
         */
        Boolean(capabilities['se:cdp'])
    )
}

/**
 * detects if session is run using Chromium protocol
 * @param  {object}  capabilities session capabilities
 * @return {Boolean}              true if session is run with Chromium protocol
 */
function isChromium(capabilities?: Capabilities.DesiredCapabilities) {
    if (!capabilities) {
        return false
    }
    return (isChrome(capabilities) || isEdge(capabilities))
}

/**
 * returns information about the environment before the session is created
 * @param  {Object}  capabilities           caps provided by user
 * @param  {string=} automationProtocol     `devtools`
 * @return {Object}                         object with environment flags
 */
export function capabilitiesEnvironmentDetector(capabilities: WebdriverIO.Capabilities, automationProtocol: string) {
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
export function sessionEnvironmentDetector({ capabilities, requestedCapabilities }:
    { capabilities: Capabilities.RemoteCapability, requestedCapabilities: Capabilities.RemoteCapability }) {
    const cap: WebdriverIO.Capabilities = 'alwaysMatch' in capabilities
        ? capabilities.alwaysMatch
        : capabilities
    return {
        isW3C: isW3C(cap),
        isChrome: isChrome(cap),
        isFirefox: isFirefox(cap),
        isMobile: isMobile(cap),
        isIOS: isIOS(cap),
        isAndroid: isAndroid(cap),
        isSauce: isSauce(requestedCapabilities),
        isSeleniumStandalone: isSeleniumStandalone(cap),
        isBidi: isBidi(capabilities),
        isChromium: isChromium(cap)
    }
}

/**
 * returns information about the environment when `devtools` protocol is used
 * @param  {Object}  capabilities           caps of session response
 * @return {Object}                         object with environment flags
 */
export function devtoolsEnvironmentDetector(capabilities: WebdriverIO.Capabilities) {
    return {
        isDevTools: true,
        isW3C: true,
        isMobile: false,
        isIOS: false,
        isAndroid: false,
        isFirefox: false,
        isChrome: capabilities.browserName === 'chrome',
        isSauce: false,
        isSeleniumStandalone: false,
        isBidi: false,
        isChromium: capabilities.browserName === 'chrome' || isChromium(capabilities)
    }
}

/**
 * returns information about the environment before the session is created
 * `isW3C`, `isSeleniumStandalone` cannot be detected
 * @param  {Object}  capabilities           caps provided by user
 * @return {Object}                         object with environment flags
 */
export function webdriverEnvironmentDetector(capabilities: WebdriverIO.Capabilities) {
    return {
        isChrome: isChrome(capabilities),
        isFirefox: isFirefox(capabilities),
        isMobile: isMobile(capabilities),
        isIOS: isIOS(capabilities),
        isAndroid: isAndroid(capabilities),
        isSauce: isSauce(capabilities),
        isBidi: isBidi(capabilities),
        isChromium: isChromium(capabilities)
    }
}
