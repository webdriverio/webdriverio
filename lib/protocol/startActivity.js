/**
 *
 * Start an arbitrary Android activity during a session.
 *
 * <example>
    :startActivitySync.js
    browser.startActivity({
        appPackage: 'io.appium.android.apis',
        appActivity: '.view.DragAndDropDemo'
    });
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

let startActivity = function (appPackage, appActivity) {
    if (typeof appPackage !== 'string' || typeof appActivity !== 'string') {
        throw new ProtocolError(`startActivity command requires two parameter (appPackage, appActivity) from type string`)
    }

    return this.requestHandler.create(
        '/session/:sessionId/appium/device/start_activity',
        { appPackage, appActivity }
    )
}

export default startActivity
