/**
 *
 * Perform multi touch action
 *
 * @param {Object} touchAttr contains attributes of touch gesture (e.g. `element`, `x` and `y`)
 *
 * @see  https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/other/appium-bindings.md#touchaction--multitouchaction
 * @type mobile
 * @for android, ios
 *
 */

export default function performMultiAction (multiTouchAction = {}) {
    return this.requestHandler.create({
        path: '/session/:sessionId/touch/multi/perform',
        method: 'POST'
    }, multiTouchAction)
}
