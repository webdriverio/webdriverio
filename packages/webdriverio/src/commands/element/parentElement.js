
/**
 *
 * Returns the parent element of the selected DOM-element.
 *
 * <example>
    :index.html
    <ul id="parent">
        <li>Sibling One</li>
        <li>Sibling Two</li>
        <li>Sibling Three</li>
    </ul>
    :prev.js
    it('should get id from parent element', () => {
        const elem = $$('li');
        console.log(elem[2].parentElement().getAttribute('id')); // outputs: "parent"
    });
 * </example>
 *
 * @alias element.parentElement
 * @return {Element}
 * @type utility
 */

export default function parentElement () {
    return this.$(function () { return this.parentElement })
}