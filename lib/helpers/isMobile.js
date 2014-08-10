/**
 * check if current platform is mobile device
 *
 * @param  {Object}  caps  capabilities
 * @return {Boolean}       true if platform is mobile device
 */

module.exports = function(caps) {

    return (typeof caps['device-orientation'] !== 'undefined' && (caps['device-orientation'].toLowerCase() === 'portrait' || caps['device-orientation'].toLowerCase() === 'landscape')) ||
           (caps.browserName === '' || caps.browserName.toLowerCase() === 'ipad' || caps.browserName.toLowerCase() === 'iphone' || caps.browserName.toLowerCase() === 'android') ||
           (caps['device-type'] !== '' || caps.deviceName !== '') ||
           (caps.app === 'safari');

};