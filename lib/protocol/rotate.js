/**
 *
 * Perform a rotation gesture centered on the specified element.
 *
 * <example>
    :rotate.js
    browser.rotate(114, 198);
 * </example>
 *
 * @param {Number} x          x offset to use for the center of the rotate gesture (default 0)
 * @param {Number} y          y offset to use for the center of the rotate gesture (default 0)
 * @param {Number} radius     The distance in points from the center to the edge of the circular path.
 * @param {Number} rotation   The length of rotation in radians. (default pi (π))
 * @param {Number} touchCount The number of touches to use in the specified gesture. (Effectively, the number of fingers a user would use to make the specified gesture.) Valid values are 1 to 5. (default 2)
 * @param {Number} duration   The length of hold time for the specified gesture, in seconds. (default is 1 second if you don't set it)
 *
 * @see https://developer.apple.com/library/ios/documentation/ToolsLanguages/Reference/UIAElementClassReference/#//apple_ref/javascript/instm/UIAElement/rotateWithOptions
 * @type mobile
 * @for ios
 *
 */

export default function rotate (x = 0, y = 0, radius = 0, rotation = Math.PI, touchCount = 2, duration = 1) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/rotate',
        method: 'POST'
    }, { x, y, radius, rotation, touchCount, duration })
}
