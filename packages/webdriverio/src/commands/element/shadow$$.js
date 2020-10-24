/**
 *
 * Access elements inside a given element's shadowRoot
 *
 * <example>
    :shadow$$.js
    it('should return elements inside a shadowRoot', () => {
        const innerEl = $('.input').shadow$$('#innerEl');
        console.log(innerEl.getValue()); // outputs: 'test123'
    });
 * </example>
 *
 * If you are working with lots of nested shadow roots,
 * an alternative approach to `shadow$$` is to use a custom locator strategy,
 * for example: https://www.npmjs.com/package/query-selector-shadow-dom#webdriverio
 *
 * @alias element.shadow$$
 * @param {String|Function} selector  selector or JS Function to fetch a certain element
 * @return {ElementArray}
 * @type utility
 *
 */

import { shadowFnFactory } from '../../scripts/shadowFnFactory'

export default async function shadowRoot (selector) {
    return await this.$$(shadowFnFactory(selector, true))
}
