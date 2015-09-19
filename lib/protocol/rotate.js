/**
 *
 * Rotate device.
 *
 * <example>
    :rotate.js
    client.rotate(114, 198, 5, 3, 220, 2);
 * </example>
 *
 * @type appium
 *
 */

let rotate = function (x, y, duration, radius, rotation, touchCount) {
    return this.requestHandler.create({
        path: '/session/:sessionId/appium/device/rotate',
        method: 'POST'
    }, {
        x: x,
        y: y,
        duration: duration,
        radius: radius,
        rotation: rotation,
        touchCount: touchCount
    })
}

export default rotate
