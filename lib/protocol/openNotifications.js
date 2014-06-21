/**
 *
 * Open Notifications
 *
 * @type appium
 *
 */

module.exports = function openNotifications() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/device/open_notifications',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, callback);

};