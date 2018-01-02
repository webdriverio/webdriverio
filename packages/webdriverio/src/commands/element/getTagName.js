/**
 *
 * Get tag name of a DOM-element found by given selector.
 *
 * <example>
    :index.html
    <div id="elem">Lorem ipsum</div>

    :getTagName.js
    it('should demonstrate the getTagName command', function () {
        var elem = $('#elem');

        var tagName = elem.getTagName();
        console.log(tagName); // outputs: "div"
    })
 * </example>
 *
 * @alias browser.getTagName
 * @param   {String}           selector   element with requested tag name
 * @return {String|String[]}             the element's tag name, as a lowercase string
 * @uses protocol/elements, protocol/elementIdName
 * @type property
 *
 */

export default function getTagName() {
    return this.getElementTagName(this.elementId)
}
