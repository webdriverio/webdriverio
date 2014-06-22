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
 * @returns {String} device orientation (`{landscape|portrait}`)
 * @uses protocol/orientation
 * @type mobile
 *
 */

var async = require('async'),
    ErrorHandler = require('../utils/ErrorHandler.js');

module.exports = function getOrientation () {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1],
        self = this,
        response = {};

    if(!this.isMobile) {
        return callback(new ErrorHandler.CommandError('getOrientation command is not supported on non mobile platforms'));
    }

    async.waterfall([
        function(cb) {
            self.orientation(cb);
        },
        function(res, cb) {
            response.orientation = res;
            cb();
        }
    ], function(err) {

        var value = response.orientation && response.orientation.value;

        callback(err, value.toLowerCase(), response);

    });

};