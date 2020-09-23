
/**
 * 
 * Returns the previous sibling element of the selected DOM-element.
 * 
 * <example>
    :index.html
    <ul id="parent">
        <li><a href="/">Sibling One</a></li>
        <li><a href="/">Sibling Two</a></li>
        <li><a href="/">Sibling Three</a></li>
    </ul>
    :prev.js
    it('should get text from previous sibling element', () => {
        const elem = $$('li');
        console.log(elem[1].next().getText()); // outputs: "Sibling Three"
    });
 * </example>
 *
 * @alias element.next
 * @return {Element}
 * @type utility
 */

export default function next () {
    return this.$(function () { return this.nextElementSibling })
}