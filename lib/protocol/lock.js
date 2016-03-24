/**
 *
 * Lock the device.
 *
 * <example>
    :lockIt.js
    // lock screen in 1.5 seconds
    browser.lock(1.5)

    :lockItSync.js
    it('demonstrate the lock and unlock command', function () {
        browser.lock();
        console.log(browser.isLocked()); // true

        browser.unlock();
        console.log(browser.isLocked()); // false
    });
 * </example>
 *
 * @param {Number} seconds  wait in seconds until lock screen
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/appium-bindings.md#lock
 * @type mobile
 * @for android
 *
 */

let lock = function (seconds = 0) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/lock',
        method: 'POST'
    }, { seconds })
}

export default lock
