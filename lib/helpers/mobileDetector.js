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
        (typeof caps.deviceName !== 'undefined') ||
        // Check browserName for specific values
        (caps.browserName === '' ||
             (caps.browserName !== undefined && (caps.browserName.toLowerCase() === 'ipad' || caps.browserName.toLowerCase() === 'iphone' || caps.browserName.toLowerCase() === 'android')))
    )

    let isIOS = Boolean(
        (caps.platformName && caps.platformName.match(/iOS/i)) ||
        (caps.deviceName && caps.deviceName.match(/(iPad|iPhone)/i))
    )

    let isAndroid = Boolean(
        (caps.platformName && caps.platformName.match(/Android/i)) ||
        (caps.browserName && caps.browserName.match(/Android/i))
    )

    let isPhone = Boolean(
        (caps.deviceName && caps.deviceName.match(/iPhone/i)) ||
        (caps['device-type'] && caps['device-type'].match(/phone/i)) ||
        (caps.deviceType && caps.deviceType.match(/phone/i))
    )

    let isTablet = Boolean(
        (caps.deviceName && caps.deviceName.match(/iPad/i)) ||
        (caps['device-type'] && caps['device-type'].match(/tablet/i)) ||
        (caps.deviceType && caps.deviceType.match(/tablet/i))
    )

    return { isMobile, isIOS, isAndroid, isPhone, isTablet }
}

export default mobileDetector
