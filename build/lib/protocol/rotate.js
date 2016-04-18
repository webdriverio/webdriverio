/**
 *
 * Perform a rotation gesture centered on the specified element.
 *
 * <example>
    :rotateSync.js
    browser.rotate(114, 198);
 * </example>
 *
 * @param {Number} x          x offset to use for the center of the rotate gesture (default 0)
 * @param {Number} y          y offset to use for the center of the rotate gesture (default 0)
 * @param {Number} duration   The length of hold time for the specified gesture, in seconds. (default 1)
 * @param {Number} radius     The distance in points from the center to the edge of the circular path.
 * @param {Number} rotation   The length of rotation in radians. (default pi (π))
 * @param {Number} touchCount The number of touches to use in the specified gesture. (Effectively, the number of fingers a user would use to make the specified gesture.) Valid values are 1 to 5. (default 2)
 *
 * @see https://developer.apple.com/library/ios/documentation/ToolsLanguages/Reference/UIAElementClassReference/#//apple_ref/javascript/instm/UIAElement/rotateWithOptions
 * @type mobile
 * @for ios
 *
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});
var rotate = function rotate() {
    var x = arguments.length <= 0 || arguments[0] === undefined ? 0 : arguments[0];
    var y = arguments.length <= 1 || arguments[1] === undefined ? 0 : arguments[1];
    var duration = arguments.length <= 2 || arguments[2] === undefined ? 1 : arguments[2];
    var radius = arguments.length <= 3 || arguments[3] === undefined ? 0 : arguments[3];
    var rotation = arguments.length <= 4 || arguments[4] === undefined ? Math.PI : arguments[4];
    var touchCount = arguments.length <= 5 || arguments[5] === undefined ? 2 : arguments[5];

    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/rotate',
        method: 'POST'
    }, { x: x, y: y, duration: duration, radius: radius, rotation: rotation, touchCount: touchCount });
};

exports['default'] = rotate;
module.exports = exports['default'];
