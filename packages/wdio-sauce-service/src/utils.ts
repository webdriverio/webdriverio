import type { Capabilities } from '@wdio/types'

/**
 * Determine if the current instance is a RDC instance. RDC tests are Real Device tests
 * that can be started with different sets of capabilities. A deviceName is not mandatory, the only mandatory cap for
 * RDC is the platformName. Downside of the platformName is that is can also be EMUSIM. EMUSIM can be distinguished by
 * the `Emulator|Simulator` postfix
 *
 * @param {object} caps
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
export function isRDC (caps: Capabilities.DesiredCapabilities){
    const { 'appium:deviceName': appiumDeviceName = '', deviceName = '', platformName = '' } = caps
    const name = appiumDeviceName || deviceName

    // If the string contains `simulator` or `emulator` it's an EMU/SIM session
    return !name.match(/(simulator)|(emulator)/gi) && !!platformName.match(/(ios)|(android)/gi)
}

/**
 * Determine if this is an EMUSIM session
 * @param {object} caps
 * @returns {boolean}
 */
export function isEmuSim (caps: Capabilities.DesiredCapabilities){
    const { 'appium:deviceName': appiumDeviceName = '', deviceName = '', platformName = '' } = caps
    const name = appiumDeviceName || deviceName

    // If the string contains `simulator` or `emulator` it's an EMU/SIM session
    return !!name.match(/(simulator)|(emulator)/gi) && !!platformName.match(/(ios)|(android)/gi)
}

/** Ensure capabilities are in the correct format for Sauce Labs
 * @param {string} tunnelIdentifier - The default Sauce Connect tunnel identifier
 * @param {object} options - Additional options to set on the capability
 * @returns {function(object): void} - A function that mutates a single capability
 */
export function makeCapabilityFactory(tunnelIdentifier: string) {
    return (capability: Capabilities.DesiredCapabilities) => {
        // If the `sauce:options` are not provided and it is a W3C session then add it
        if (!capability['sauce:options']) {
            capability['sauce:options'] = {}
        }

        capability['sauce:options'].tunnelIdentifier = (
            capability.tunnelIdentifier ||
            capability['sauce:options'].tunnelIdentifier ||
            tunnelIdentifier
        )
    }
}

export function ansiRegex () {
    const pattern = [
        '[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:[a-zA-Z\\d]*(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
        '(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-ntqry=><~]))'
    ].join('|')

    return new RegExp(pattern, 'g')
}
