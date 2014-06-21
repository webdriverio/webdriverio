/**
 *
 * reset an app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#reset
 * @type appium
 *
 */

module.exports = function resetApp() {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/app/reset',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, callback);

};