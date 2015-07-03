/**
 *
 * get the app's strings
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#app-strings
 * @type appium
 *
 */

module.exports = function getAppStrings(language) {

    var requestOptions = {
        path: '/session/:sessionId/appium/app/strings',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, {language: language});

};