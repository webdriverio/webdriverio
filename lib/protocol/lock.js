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

module.exports = function lock(seconds) {

    if(typeof seconds !== 'number') {
        seconds = 0;
    }

    var requestOptions = {
        path: '/session/:sessionId/appium/device/lock',
        method: 'POST'
    };

    return this.requestHandler.create(requestOptions, { seconds: seconds });

};