/**
 *
 * Unlock the device.
 *
 * <example>
    :unlockIt.js
    browser.unlock()
 * </example>
 *
 * @type mobile
 * @for android
 *
 */

let unlock = function () {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/unlock',
        method: 'POST'
    })
}

export default unlock
