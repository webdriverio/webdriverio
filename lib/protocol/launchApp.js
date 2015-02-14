/**
 *
 * launch the app
 *
 * @callbackParameter error, response
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#launch
 * @type appium
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