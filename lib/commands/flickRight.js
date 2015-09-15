/**
 *
 * Perform a drag right on an element.
 *
 * @param {String} selector   element to drag on
 * @param {Number} duration   time (in seconds) to spend performing the drag
 *
 * @uses mobile/flick
 * @type mobile
 *
 */

let flickRight = function (selector, duration = 0.3) {
    return this.flick(selector, -0.5, 0, duration)
}

export default flickRight
