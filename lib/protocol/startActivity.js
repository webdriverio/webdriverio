/**
 *
 * Start an arbitrary Android activity during a session.
 *
 * <example>
    :startActivity.js
    browser.startActivity({
        appPackage: 'io.appium.android.apis',
        appActivity: '.view.DragAndDropDemo'
    });
 * </example>
 *
 * @param {String} appPackage   name of app
 * @param {String} appActivity  name of activity
 * @type mobile
 * @for android
 *
 */

import { ProtocolError } from '../utils/ErrorHandler'

export default function startActivity (appPackage, appActivity) {
    if (typeof appPackage !== 'string' || typeof appActivity !== 'string') {
        throw new ProtocolError(
            'startActivity command requires two parameter (appPackage, appActivity) from type string'
        )
    }

    return this.requestHandler.create(
        '/session/:sessionId/appium/device/start_activity',
        { appPackage, appActivity }
    )
}
