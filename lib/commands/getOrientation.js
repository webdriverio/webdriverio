/**
 *
 * Get the current browser orientation.
 *
 * <example>
    :getLocationInView.js
    var client = require('webdriverio').remote({
        desiredCapabilities: {
            browserName: 'safari',
            platform: 'OS X 10.9',
            deviceName: 'iPad',
            device: 'iPad Simulator',
            platformVersion: '7.1',
            platformName: 'iOS',
            app: 'safari',
            'device-orientation': 'landscape'
        }
    })

    client
        .getOrientation(function(err, orientation) {
            console.log(orientation); // outputs: "landscape"
        })
 * </example>
 *
 * @callbackParameter error, orientation
 * @returns {String} device orientation (`{landscape|portrait}`)
 * @uses protocol/orientation
 * @type mobile
 *
 */

var ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getOrientation () {

    if(!this.isMobile) {
        throw new ErrorHandler.CommandError('getOrientation command is not supported on non mobile platforms');
    }

    return this.unify(this.orientation());

};