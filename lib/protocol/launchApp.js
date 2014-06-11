/**
 *
 * launch app (Appium specific command)
 *
 * ### Usage:
 *
 *     client.launchApp()
 *
 */

module.exports = function launchApp() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/app/launch',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, callback);

};