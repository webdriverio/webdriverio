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
    it('should get text from previous sibling element', async () => {
        const elem = await $$('p');
        const previousElem = await elem[1].previousElement()
        console.log(await previousElem.getText()); // outputs: "Sibling One"
    });
 * </example>
 *
 * @alias element.previousElement
 * @return {Element}
 * @type utility
 */
export function previousElement (this: WebdriverIO.Element) {
    return this.$(/* istanbul ignore next */ function previousElement (this: HTMLElement) {
        return this.previousElementSibling as HTMLElement
    })
}
