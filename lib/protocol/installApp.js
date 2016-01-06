/**
 *
 * Install an app on device.
 *
 * <example>
    :installApp.js
    browser.installApp('/path/to/my/App.app');
 * </example>
 *
 * @param {String} path  path to Android application
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#install-app
 * @type mobile
 * @for android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let installApp = function (appPath) {
    if (typeof appPath !== 'string') {
        throw new ProtocolError('installApp command requires appPath parameter from type string')
    }

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/install_app',
        method: 'POST'
    }, { appPath })
}

export default installApp
