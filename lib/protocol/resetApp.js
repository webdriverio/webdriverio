/**
 *
 * reset an app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#reset
 * @type appium
 *
 */

module.exports = function resetApp() {

    var requestOptions = {
        path: '/session/:sessionId/appium/app/reset',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions);

};