/**
 * check if current platform is mobile device
 *
 * @param  {Object}  caps  capabilities
 * @return {Boolean}       true if platform is mobile device
 */

module.exports = function(caps) {

    return (caps['device-orientation'] && (caps['device-orientation'].toLowerCase() === 'portrait' || caps['device-orientation'].toLowerCase() === 'landscape')) ||
           (caps.browserName === '' || browserName.toLowerCase() === 'ipad' || browserName.toLowerCase() === 'iphone' || browserName.toLowerCase() === 'android') ||
           (caps['device-type'] && caps['device-type'] !== '');

};