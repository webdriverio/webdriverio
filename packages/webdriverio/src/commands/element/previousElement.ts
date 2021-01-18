/**
 *
 * Returns the previous sibling element of the selected DOM-element.
 *
 * <example>
    :index.html
    <div class="parent">
        <p>Sibling One</p>
        <p>Sibling Two</p>
        <p>Sibling Three</p>
    </div>
    :previousElement.js
    it('should get text from previous sibling element', () => {
        const elem = $$('p');
        console.log(elem[1].previousElement().getText()); // outputs: "Sibling One"
    });
 * </example>
 *
 * @alias element.previousElement
 * @return {Element}
 * @type utility
 */
export default function previousElement (this: WebdriverIO.Element) {
    return this.$(/* istanbul ignore next */ function (this: HTMLElement) {
        return this.previousElementSibling as HTMLElement
    })
}
