/**
 *
 * Get the computed WAI-ARIA label of an element.
 *
 * <example>
    :getComputedRole.js
    it('should demonstrate the getComputedRole command', () => {
        browser.url('https://www.google.com/ncr')
        const elem = $('*[name="q"]');
        console.log(elem.getComputedRole()); // outputs: "combobox"
    })
 * </example>
 *
 * @alias element.getComputedRole
 * @return {String} the computed WAI-ARIA label
 * @type property
 *
 */

export default function getComputedRole (this: WebdriverIO.Element) {
    return this.getElementComputedRole(this.elementId)
}
