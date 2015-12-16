/**
 *
 * Send the currently active app to the background.
 *
 * <example>
    :backgroundApp.js
    client.background(1);
 * </example>
 *
 * @param {Number} seconds  number of seconds after the app gets send to background
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#background-app
 * @type mobile
 * @for android
 *
 */

let background = function (seconds = 0) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/app/background',
        method: 'POST'
    }, { seconds })
}

export default background
