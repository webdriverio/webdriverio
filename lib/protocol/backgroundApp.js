/**
 *
 * background app (Appium specific command)
 *
 * ### Usage:
 *
 *     client.backgroundApp(seconds)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#background-app
 * @type protocol
 *
 */

module.exports = function backgroundApp(seconds) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/app/background',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, {seconds: seconds}, callback);

};