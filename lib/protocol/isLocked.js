/**
 *
 * Check whether the device is locked or not.
 *
 * <example>
    :lockIt.js
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

export default function isLocked () {
    return this.unify(this.requestHandler.create({
        path: '/session/:sessionId/appium/device/is_locked',
        method: 'POST'
    }))
}
