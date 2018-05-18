/**
 * check if current platform is mobile device
 *
 * @param  {Object}  caps  capabilities
 * @return {Boolean}       true if platform is mobile device
 */
let mobileDetector = function (caps) {
    let isMobile = Boolean(
        (typeof caps['appium-version'] !== 'undefined') ||
        (typeof caps['device-type'] !== 'undefined') || (typeof caps['deviceType'] !== 'undefined') ||
        (typeof caps['device-orientation'] !== 'undefined') || (typeof caps['deviceOrientation'] !== 'undefined') ||
        (typeof caps.deviceName !== 'undefined') || (typeof caps.device !== 'undefined') ||
        // Check browserName for specific values
        (caps.browserName === '' ||
             (caps.browserName !== undefined && (caps.browserName.toLowerCase() === 'ipad' || caps.browserName.toLowerCase() === 'iphone' || caps.browserName.toLowerCase() === 'android')))
    )

    let isIOS = Boolean(
        (caps.platformName && caps.platformName.match(/iOS/i)) ||
        (caps.deviceName && caps.deviceName.match(/(iPad|iPhone)/i)) ||
        (caps.device && caps.device.match(/(iPad|iPhone)/i))
    )

    let isAndroid = Boolean(
        (caps.platformName && caps.platformName.match(/Android/i)) ||
        (caps.browserName && caps.browserName.match(/Android/i)) ||
        (caps.browser && caps.browser.match(/Android/i)) ||
        (caps.device && caps.device.match(/Samsung/i)) ||
        (caps.device && caps.device.match(/Motorola/i)) ||
        (caps.device && caps.device.match(/HTC/i)) ||
        (caps.device && caps.device.match(/Google/i)) ||
        (caps.device && caps.device.match(/Amazon/i))
    )

    return { isMobile, isIOS, isAndroid }
}

export default mobileDetector
