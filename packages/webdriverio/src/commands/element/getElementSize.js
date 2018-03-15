/**
 *
 * Get the width and height for an DOM-element.
 *
 * <example>
    :getElementSize.js
    it('should demonstrate the getElementSize command', function () {
        browser.url('http://github.com')
        let logo = browser.$('.octicon-mark-github')

        let size = logo.getElementSize()
        console.log(size) // outputs: { width: 32, height: 32 }

        let width = logo.getElementSize('width')
        console.log(width) // outputs: 32

        let height = logo.getElementSize('height')
        console.log(height) // outputs: 32
    })
 * </example>
 *
 * @alias browser.getElementSize
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
