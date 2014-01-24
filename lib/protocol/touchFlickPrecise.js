/**
 * perform a flick on the screen or an element
 *
 * @see https://github.com/appium/appium/blob/master/docs/gestures.md#json-wire-protocol-server-extensions
 *
 * @param {Number} touchCount  how many fingers to flick with
 * @param {Number} startX      coordinate where flick begins (in pixels or relative units)
 * @param {Number} startY      coordinate where flick begins (in pixels or relative units)
 * @param {Number} endX        coordinate where flick ends (in pixels or relative units)
 * @param {Number} endY        coordinate where flick ends (in pixels or relative units)
 * @param {Number} element     ID of element to scope this command to
 */

module.exports = function touchFlickPrecise(touchCount, startX, startY, endX, endY, element, callback) {
    var data = {
        touchCount: touchCount || 1,
        startX:     startX || 0.5,
        startY:     startY || 0.5,
        endX:       endX || 1,
        endY:       endY || 1,
        element:    element || null
    };

    this.requestHandler.create(
        '/session/:sessionId/touch/flick_precise',
        data,
        callback
    );
};