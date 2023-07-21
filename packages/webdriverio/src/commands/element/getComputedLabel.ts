/**
 *
 * Get the computed WAI-ARIA label of an element.
 *
 * <example>
    :getComputedLabel.js
    it('should demonstrate the getComputedLabel command', async () => {
        await browser.url('https://www.google.com/ncr')
        const elem = await $('*[name="q"]');
        console.log(await elem.getComputedLabel()); // outputs: "Search"
    })
 * </example>
 *
 * @alias element.getComputedLabel
 * @return {String} the computed WAI-ARIA label
 * @type property
 *
 */
export function getComputedLabel (this: WebdriverIO.Element) {
    return this.getElementComputedLabel(this.elementId)
}
