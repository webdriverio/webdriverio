/**
 * perform a tap on the screen or an element
 *
 * @see https://github.com/appium/appium/blob/master/docs/gestures.md#json-wire-protocol-server-extensions
 *
 * @param {Number} tapCount    how many times to tap
 * @param {Number} touchCount  how many fingers to tap with
 * @param {Number} duration    how long (in seconds) to tap
 * @param {Number} x           coordinate to tap (in pixels or relative units)
 * @param {Number} y           coordinate to tap (in pixels or relative units)
 * @param {Number} element     ID of element to scope this command to
 */

module.exports = function touchTap(tapCount, touchCount, duration, x, y, element, callback) {

    var data = {
        tapCount:   tapCount || 1,
        touchCount: touchCount || 1,
        duration:   duration || 0.1,
        x:          x || 0.5,
        y:          y || 0.5,
        element:    element || null
    };

    this.requestHandler.create(
        '/session/:sessionId/touch/tap',
        data,
        callback
    );

};