/**
 *
 * Check whether the device is locked or not.
 *
 * <example>
    :lockItAsync.js
    browser.lock().isLocked().then(function(isLocked) {
        console.log(isLocked); // true
    })

    :lockItSync.js
    it('demonstrate the lock and unlock command', function () {
        browser.lock();
        console.log(browser.isLocked()); // true

        browser.unlock();
        console.log(browser.isLocked()); // false
    });
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var isLocked = function isLocked() {
    return this.unify(this.requestHandler.create({
        path: '/session/:sessionId/appium/device/is_locked',
        method: 'POST'
    }));
};

exports['default'] = isLocked;
module.exports = exports['default'];
