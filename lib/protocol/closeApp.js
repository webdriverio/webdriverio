/**
 *
 * close the app
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#close-app
 * @type appium
 *
 */

module.exports = function closeApp() {

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/close',
        method: 'POST'
    });

};