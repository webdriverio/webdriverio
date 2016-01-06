/**
 *
 * Open the notifications pane on the device.
 *
 * <example>
    :openNotifications.js
    browser.openNotifications();
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

let openNotifications = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/open_notifications',
        method: 'POST'
    })
}

export default openNotifications
