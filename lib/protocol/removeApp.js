/**
 *
 * Remove an app from the device.
 *
 * <example>
    :removeApp.js
    browser.removeApp('com.example.android.apis');
 * </example>
 *
 * @param {String} bundleId  bundle ID of application
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#remove-app
 * @type mobile
 * @for android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let removeApp = function (bundleId) {
    if (typeof appPath !== 'string') {
        throw new ProtocolError('removeApp command requires bundleId parameter from type string')
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/remove_app',
        method: 'POST'
    }, { bundleId })
}

export default removeApp
