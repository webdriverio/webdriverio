
/**
 *
 * Returns the previous sibling element of the selected DOM-element.
 *
 * <example>
    :index.html
    <ul id="parent">
        <li>Sibling One</li>
        <li>Sibling Two</li>
        <li>Sibling Three</li>
    </ul>
    :prev.js
    it('should get text from previous sibling element', () => {
        const elem = $$('li');
        console.log(elem[1].previousElement().getText()); // outputs: "Sibling One"
    });
 * </example>
 *
 * @alias element.previousElement
 * @return {Element}
 * @type utility
 */

export default function previousElement () {
    return this.$(function () { return this.previousElementSibling })
}