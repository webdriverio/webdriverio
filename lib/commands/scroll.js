/**
 *
 * Scroll to a specific element. You can also append/pass two offset values as parameter
 * to scroll to a specific position.
 *
 * <example>
    :scroll.js
    client
        // scroll to specific element
        .scroll('#myElement')

        // scroll to specific element with offset
        // scroll offset will be added to elements position
        .scroll('#myElement', 100, 100)

        // scroll to specific x and y position
        .scroll(0, 250)
        .end();
 * </example>
 *
 * @param {String=}  selector  element to scroll to
 * @param {Number}   xoffset   x offset to scroll to
 * @param {Number}   yoffset   y offset to scroll to
 *
 * @uses protocol/element, protocol/elementIdLocation, protocol/touchScroll, protocol/execute
 * @type utility
 *
 */

import scrollHelper from '../scripts/scroll'

let scroll = function (selector, xoffset = 0, yoffset = 0) {
    if (typeof selector === 'number' && typeof xoffset === 'number') {
        yoffset = xoffset
        xoffset = selector
        selector = null
    }

    if (this.isMobile) {
        var queue = Promise.resolve()

        if (selector) {
            queue = this.element(selector)
        }

        return queue.then((res) => {
            if (typeof res !== 'undefined') {
                selector = res.value.ELEMENT
            }

            return this.touchScroll(selector, xoffset, yoffset)
        })
    }

    if (selector) {
        return this.element(selector).then((res) =>
            this.elementIdLocation(res.value.ELEMENT)
        ).then((location) =>
            this.execute(scrollHelper, location.value.x + xoffset, location.value.y + yoffset)
        )
    }

    return this.execute(scrollHelper, xoffset, yoffset)
}

export default scroll
