/**
 *
 * Get tag name of a DOM-element.
 *
 * <example>
    :index.html
    <div id="elem">Lorem ipsum</div>

    :getTagName.js
    it('should demonstrate the getTagName command', function () {
        const elem = $('#elem');

        const tagName = elem.getTagName();
        console.log(tagName); // outputs: "div"
    })
 * </example>
 *
 * @alias browser.getTagName
 * @return {String} the element's tag name, as a lowercase string
 * @uses protocol/elements, protocol/elementIdName
 * @type property
 *
 */

export default function getTagName() {
    return this.getElementTagName(this.elementId)
}
