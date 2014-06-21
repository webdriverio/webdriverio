/**
 *
 * close the app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#close-app
 * @type appium
 *
 */

module.exports = function closeApp() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/app/close',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, callback);

};