/**
 *
 * Perform a drag up on an element.
 *
 * @param {String} selector   element to drag on
 * @param {Number} duration   time (in seconds) to spend performing the drag
 *
 * @uses mobile/flick
 * @type mobile
 *
 */

let flickUp = function (selector, duration = 0.3) {
    return this.flick(selector, 0, -0.5, duration)
}

export default flickUp
