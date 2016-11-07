/**
 *
 * Get the width and height for an DOM-element based given selector.
 *
 * <example>
    :getElementSize.js
    it('should give me the size of an element', function () {
        browser.url('http://github.com')
        var logo = $('.octicon-mark-github')

        var size = logo.getElementSize()
        // or
        size = browser.getElementSize('.octicon-mark-github')
        console.log(size) // outputs: { width: 32, height: 32 }

        var width = logo.getElementSize('width')
        // or
        width = browser.getElementSize('.octicon-mark-github', 'width')
        console.log(width) // outputs: 32

        var height = logo.getElementSize('height')
        // or
        height = browser.getElementSize('.octicon-mark-github', 'height')
        console.log(height) // outputs: 32
    })
 * </example>
 *
 * @alias browser.getElementSize
 * @param   {String} selector element with requested size
 * @returns {Object}          requested element size (`{width:number, height:number}`)
 * @uses protocol/elements, protocol/elementIdSize
 * @type property
 *
 */

import { CommandError } from '../utils/ErrorHandler'

let getElementSize = function (selector, prop) {
    return this.elements(selector).then(function (res) {
        /**
         * throw NoSuchElement error if no element was found
         */
        if (!res.value || res.value.length === 0) {
            throw new CommandError(7, selector || this.lastResult.selector)
        }

        let elementIdSizeCommands = []
        for (let elem of res.value) {
            elementIdSizeCommands.push(this.elementIdSize(elem.ELEMENT))
        }

        return Promise.all(elementIdSizeCommands)
    }).then((sizes) => {
        /**
         * result already unwrapped when command was reran
         */
        if (!Array.isArray(sizes)) {
            return sizes
        }

        sizes = sizes.map((size) => {
            if (typeof prop === 'string' && prop.match(/(width|height)/)) {
                return size.value[prop]
            }

            return {
                width: size.value.width,
                height: size.value.height
            }
        })

        return sizes.length === 1 ? sizes[0] : sizes
    })
}

export default getElementSize
