/**
 * check if current platform is mobile device
 *
 * @param  {Object}  caps  capabilities
 * @return {Boolean}       true if platform is mobile device
 */
let mobileDetector = function (caps) {
    let isMobile = !!(
            (typeof caps['appium-version'] !== 'undefined') ||
            (typeof caps['device-type'] !== 'undefined') || (typeof caps['deviceType'] !== 'undefined') ||
            (typeof caps['device-orientation'] !== 'undefined') || (typeof caps['deviceOrientation'] !== 'undefined') ||
            (typeof caps.deviceName !== 'undefined') ||
            (!caps.browserName || caps.browserName === '' || caps.browserName.toLowerCase() === 'ipad' || caps.browserName.toLowerCase() === 'iphone' || caps.browserName.toLowerCase() === 'android')
    )

    let isIOS = !!(
        (caps.platformName && caps.platformName.match(/iOS/i)) ||
        (caps.deviceName && caps.deviceName.match(/(iPad|iPhone)/i))
    )

    let isAndroid = !!(
        (caps.platformName && caps.platformName.match(/Android/i)) ||
        (caps.browserName && caps.browserName.match(/Android/i))
    )

    return { isMobile, isIOS, isAndroid }
}

export default mobileDetector
