/**
 *
 * lock screen
 *
 * @param {Number} seconds  wait in seconds until lock screen
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/appium-bindings.md#lock
 * @type appium
 *
 */

let lock = function (seconds = 0) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/lock',
        method: 'POST'
    }, {
        seconds: seconds
    })
}

export default lock
