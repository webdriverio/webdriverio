/**
 *
 * Check if an app is installed.
 *
 * <example>
    :isAppInstalledSync.js
    browser.isAppInstalled('com.example.android.apis');
 * </example>
 *
 * @param {String} bundleId  ID of bundled app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#is-installed
 * @type mobile
 * @for android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let isAppInstalled = function (bundleId) {
    if (typeof appPath !== 'string') {
        throw new ProtocolError('isAppInstalled command requires bundleId parameter from type string')
    }

    return this.unify(this.requestHandler.create({
        path: '/session/:sessionId/appium/device/app_installed',
        method: 'POST'
    }, { bundleId }))
}

export default isAppInstalled
