/**
 *
 * get app strings (Appium specific command)
 *
 * ### Usage:
 *
 *     client.getAppStrings(language)
 *
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#app-strings
 * @type protocol
 *
 */

module.exports = function getAppStrings(language) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var requestOptions = {
        path: '/session/:sessionId/appium/app/strings',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, {language: language}, callback);

};