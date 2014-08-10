/**
 * check if current platform is mobile device
 *
 * @param  {Object}  caps  capabilities
 * @return {Boolean}       true if platform is mobile device
 */

module.exports = function(caps) {

    return (typeof caps['appium-version'] !== 'undefined') ||
           (typeof caps['device-type'] !== 'undefined') ||
           (typeof caps['device-orientation'] !== 'undefined') ||
           (typeof caps.deviceName !== 'undefined') ||
           (caps.browserName === '' || caps.browserName.toLowerCase() === 'ipad' || caps.browserName.toLowerCase() === 'iphone' || caps.browserName.toLowerCase() === 'android');

};