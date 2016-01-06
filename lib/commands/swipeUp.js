/**
 *
 * Perform a swipe up on an element.
 *
 * @param {String} selector  element to swipe on
 * @param {Number} speed     time (in seconds) to spend performing the swipe
 *
 * @uses mobile/swipe
 * @type mobile
 *
 */

let swipeUp = function (selector, yOffset = -100, speed = 100) {
    /**
     * make sure yoffset is negative so we scroll down
     */
    yOffset = yOffset > 0 ? yOffset * -1 : yOffset

    return this.pause(100).swipe(selector, 0, yOffset, speed)
}

export default swipeUp
