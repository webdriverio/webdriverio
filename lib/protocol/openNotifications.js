/**
 *
 * Open the notifications pane on the device.
 *
 * <example>
    :openNotificationsSync.js
    browser.openNotifications();
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

export default function openNotifications () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/open_notifications',
        method: 'POST'
    })
}
