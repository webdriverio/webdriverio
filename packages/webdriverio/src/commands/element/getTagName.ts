/**
 *
 * Get tag name of a DOM-element.
 *
 * <example>
    :index.html
    <div id="elem">Lorem ipsum</div>

    :getTagName.js
    it('should demonstrate the getTagName command', async () => {
        const elem = await $('#elem');

        const tagName = await elem.getTagName();
        console.log(tagName); // outputs: "div"
    })
 * </example>
 *
 * @alias element.getTagName
 * @return {String} the element's tag name, as a lowercase string
 * @uses protocol/elements, protocol/elementIdName
 * @type property
 *
 */
export function getTagName (this: WebdriverIO.Element) {
    return this.getElementTagName(this.elementId)
}
