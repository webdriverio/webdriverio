/**
 *
 * Perform a swipe down on an element.
 *
 * @alias browser.swipeDown
 * @param {String} selector  element to swipe on
 * @param {Number} speed     number of pixels go per second
 * @uses mobile/swipe
 * @type mobile
 *
 */

let swipeDown = function (selector, yOffset, speed) {
    /**
     * we can't use default values for function parameter here because this would
     * break the ability to chain the command with an element if reverse is used
     */
    yOffset = typeof yOffset === 'number' ? yOffset : 100
    speed = typeof speed === 'number' ? speed : 100

    /**
     * make sure yoffset is positive so we scroll up
     */
    yOffset = yOffset < 0 ? yOffset * -1 : yOffset

    return this.pause(100).swipe(selector, 0, yOffset, speed)
}

export default swipeDown
