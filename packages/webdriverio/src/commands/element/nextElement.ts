/**
 *
 * Returns the next sibling element of the selected DOM-element.
 *
 * <example>
    :index.html
    <div class="parent">
        <p>Sibling One</p>
        <p>Sibling Two</p>
        <p>Sibling Three</p>
    </div>
    :nextElement.js
    it('should get text from next sibling element', () => {
        const elem = $$('p');
        console.log(elem[1].nextElement().getText()); // outputs: "Sibling Three"
    });
 * </example>
 *
 * @alias element.nextElement
 * @return {Element}
 * @type utility
 */

export default function nextElement (this: WebdriverIO.Element) {
    return this.$(/* istanbul ignore next */ function (this: HTMLElement) {
        return this.nextElementSibling as HTMLElement
    })
}
