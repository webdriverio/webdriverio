/**
 *
 * launch the app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#launch
 * @type appium
 *
 */

module.exports = function launchApp() {

    var requestOptions = {
        path: '/session/:sessionId/appium/app/launch',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};