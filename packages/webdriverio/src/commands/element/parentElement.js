
/**
 *
 * Returns the parent element of the selected DOM-element.
 *
 * <example>
    :index.html
    <div class="parent">
        <p>Sibling One</p>
        <p>Sibling Two</p>
        <p>Sibling Three</p>
    </div>
    :parentElement.js
<<<<<<< HEAD
    it('should get class from parent element', () => {
=======
    it('should get id from parent element', () => {
>>>>>>> upstream/master
        const elem = $$('p');
        console.log(elem[2].parentElement().getAttribute('class')); // outputs: "parent"
    });
 * </example>
 *
 * @alias element.parentElement
 * @return {Element}
 * @type utility
 */

export default function parentElement () {
    return this.$(/* istanbul ignore next */ function () { return this.parentElement })
}