import type { Element } from '../../types'

/**
 *
 * Get the computed WAI-ARIA label of an element.
 *
 * <example>
    :getComputedLabel.js
    it('should demonstrate the getComputedLabel command', () => {
        browser.url('https://www.google.com/ncr')
        const elem = $('*[name="q"]');
        console.log(elem.getComputedLabel()); // outputs: "Search"
    })
 * </example>
 *
 * @alias element.getComputedLabel
 * @return {String} the computed WAI-ARIA label
 * @type property
 *
 */
export default function getComputedLabel (this: Element) {
    return this.getElementComputedLabel(this.elementId)
}
