/**
 *
 * Perform a swipe left on an element.
 *
 * @param {String} selector  element to swipe on
 * @param {Number} speed     time (in seconds) to spend performing the swipe
 *
 * @uses mobile/flick
 * @type mobile
 *
 */

let swipeLeft = function (selector, xOffset, speed) {
    /**
     * we can't use default values for function parameter here because this would
     * break the ability to chain the command with an element if reverse is used
     */
    xOffset = typeof xOffset === 'number' ? xOffset : 100
    speed = typeof speed === 'number' ? speed : 100

    /**
     * make sure xoffset is positive so we scroll right
     */
    xOffset = xOffset > 0 ? xOffset * -1 : xOffset

    return this.pause(100).swipe(selector, xOffset, 0, speed)
}

export default swipeLeft
