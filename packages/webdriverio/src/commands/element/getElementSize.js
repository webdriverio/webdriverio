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
 * @param   {String}  selector element with requested size
 * @param   {String*} prop     size to receive [optional] ("width" or "height")
 * @return {Object|Number}    requested element size (`{ width: <Number>, height: <Number> }`) or actual width/height as number if prop param is given
 * @uses protocol/elements, protocol/getElementRect
 * @type property
 *
 */

export default async function getElementSize(prop = null) {
    const rect = await this.getElementRect(this.elementId)

    if(!prop) {
        return {
            width: rect.width,
            height: rect.height
        }
    }

    if(rect[prop]) {
        return rect[prop]
    }
}
