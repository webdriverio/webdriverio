import { isW3C } from '@wdio/utils'

/**
 * Determine if the current instance is a Unified Platform instance. UP tests are Real Device tests
 * that can be started with different sets of capabilities. A deviceName is not mandatory, the only mandatory cap for
 * UP is the platformName. Downside of the platformName is that is can also be EMUSIM. EMUSIM can be distinguished by
 * the `Emulator|Simulator` postfix
 *
 * @param {string} deviceName
 * @param {string} platformName
 * @returns {boolean}
 *
 * This is what we get back from the UP (for now)
 *
 * capabilities =  {
 *  webStorageEnabled: false,
 *  locationContextEnabled: false,
 *  browserName: 'safari',
 *  platform: 'MAC',
 *  javascriptEnabled: true,
 *  databaseEnabled: false,
 *  takesScreenshot: true,
 *  networkConnectionEnabled: false,
 *  platformVersion: '12.1.2',
 *  webDriverAgentUrl: 'http://127.0.0.1:5700',
 *  testobject_platform_name: 'iOS',
 *  orientation: 'PORTRAIT',
 *  realDevice: true,
 *  build: 'Sauce Real Device browser iOS - 1594732389756',
 *  commandTimeouts: { default: 60000 },
 *  testobject_device: 'iPhone_XS_ws',
 *  automationName: 'XCUITest',
 *  platformName: 'iOS',
 *  udid: '',
 *  deviceName: '',
 *  testobject_test_report_api_url: '',
 *  testobject_test_report_url: '',
 *  testobject_user_id: 'wim.selles',
 *  testobject_project_id: 'saucelabs-default',
 *  testobject_test_report_id: 51,
 *  testobject_device_name: 'iPhone XS',
 *  testobject_device_session_id: '',
 *  deviceContextId: ''
 * }
 */
export function isUnifiedPlatform({ deviceName = '', platformName = '' }){
    // If the string contains `simulator` or `emulator` it's an EMU/SIM session
    return !deviceName.match(/(simulator)|(emulator)/gi) && !!platformName.match(/(ios)|(android)/gi)
}

/**
 * Determine if this is an EMUSIM session
 * @param {string} deviceName
 * @param {string} platformName
 * @returns {boolean}
 */
export function isEmuSim({ deviceName = '', platformName = '' }){
    // If the string contains `simulator` or `emulator` it's an EMU/SIM session
    return !!deviceName.match(/(simulator)|(emulator)/gi) && !!platformName.match(/(ios)|(android)/gi)
}

/** Ensure capabilities are in the correct format for Sauce Labs
 * @param {string} tunnelIdentifier - The default Sauce Connect tunnel identifier
 * @param {object} options - Additional options to set on the capability
 * @returns {function(object): void} - A function that mutates a single capability
 */
export function makeCapabilityFactory(tunnelIdentifier, options) {
    return capability => {
        // If the capability appears to be using the legacy JSON Wire Protocol
        // we need to make sure the key 'sauce:options' is not present
        const isLegacy = Boolean(
            (capability.platform || capability.version) &&
            !isW3C(capability) &&
            !capability['sauce:options']
        )

        // Unified Platform and EMUSIM is currently not W3C ready, so the tunnel needs to be on the cap level
        if (!capability['sauce:options'] && !isLegacy && !isUnifiedPlatform(capability) && !isEmuSim(capability)) {
            capability['sauce:options'] = {}
        }

        Object.assign(capability, options)

        const sauceOptions = !isLegacy && !isUnifiedPlatform(capability) && !isEmuSim(capability) ? capability['sauce:options'] : capability
        sauceOptions.tunnelIdentifier = (
            capability.tunnelIdentifier ||
            sauceOptions.tunnelIdentifier ||
            tunnelIdentifier
        )

        if (!isLegacy && !isUnifiedPlatform(capability) && !isEmuSim(capability)) {
            delete capability.tunnelIdentifier
        }
    }
}
