/**
 *
 * Open Notifications
 *
 * @type appium
 *
 */

let openNotifications = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/open_notifications',
        method: 'POST'
    })
}

export default openNotifications
