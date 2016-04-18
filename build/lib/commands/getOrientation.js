/**
 *
 * Get the current browser orientation.
 *
 * <example>
    :getOrientation.js
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
        .init()
        .getOrientation().then(function(orientation) {
            console.log(orientation); // outputs: "landscape"
        })
        .end();
 * </example>
 *
 * @returns {String} device orientation (`landscape/portrait`)
 * @uses protocol/orientation
 * @for android, ios
 * @type mobile
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _utilsErrorHandler = require('../utils/ErrorHandler');

var getOrientation = function getOrientation() {
    if (!this.isMobile) {
        throw new _utilsErrorHandler.CommandError('getOrientation command is not supported on non mobile platforms');
    }

    return this.unify(this.orientation(), {
        lowercase: true,
        extractValue: true
    });
};

exports['default'] = getOrientation;
module.exports = exports['default'];
