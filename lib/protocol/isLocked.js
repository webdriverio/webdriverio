/**
 *
 * Check whether the device is locked or not.
 *
 * <example>
    :unlockIt.js
    browser.lock().isLocked().then(function(isLocked) {
        console.log(isLocked); // true
    })
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

let isLocked = function () {
    return this.unify(this.requestHandler.create({
        path: '/session/:sessionId/appium/device/is_locked',
        method: 'POST'
    }))
}

export default isLocked
