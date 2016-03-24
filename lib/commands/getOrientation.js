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

import { CommandError } from '../utils/ErrorHandler'

let getOrientation = function () {
    if (!this.isMobile) {
        throw new CommandError('getOrientation command is not supported on non mobile platforms')
    }

    return this.unify(this.orientation(), {
        lowercase: true,
        extractValue: true
    })
}

export default getOrientation
