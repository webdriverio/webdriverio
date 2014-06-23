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

module.exports = function rotate(x, y, duration, radius, rotation, touchCount) {

    /*!
     * make sure that callback contains chainit callback
     */
    var callback = arguments[arguments.length - 1];

    var data = {
        x: x,
        y: y,
        duration: duration,
        radius: radius,
        rotation: rotation,
        touchCount: touchCount
    };

    var requestOptions = {
        path: '/session/:sessionId/appium/device/rotate',
        method: 'POST'
    };

    this.requestHandler.create(requestOptions, data, callback);

};