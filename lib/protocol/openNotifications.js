/**
 *
 * Open Notifications
 *
 * @type appium
 *
 */

module.exports = function openNotifications() {

    var requestOptions = {
        path: '/session/:sessionId/appium/device/open_notifications',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};