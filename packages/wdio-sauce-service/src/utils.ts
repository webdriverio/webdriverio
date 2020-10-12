import { isW3C } from '@wdio/utils'

/**
 * Determine if the current instance is a Unified Platform instance
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
    // If the string contains `simulator` or `emulator` it's a EMU/SIM session
    return !deviceName.match(/(simulator)|(emulator)/gi) && !!platformName.match(/(ios)|(android)/gi)
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

        // Unified Platform is currently not W3C ready, so the tunnel needs to be on the cap level
        if (!capability['sauce:options'] && !isLegacy && !isUnifiedPlatform(capability)) {
            capability['sauce:options'] = {}
        }

        Object.assign(capability, options)

        const sauceOptions = !isLegacy && !isUnifiedPlatform(capability) ? capability['sauce:options'] : capability
        sauceOptions.tunnelIdentifier = (
            capability.tunnelIdentifier ||
            sauceOptions.tunnelIdentifier ||
            tunnelIdentifier
        )

        if (!isLegacy && !isUnifiedPlatform(capability)) {
            delete capability.tunnelIdentifier
        }
    }
}
