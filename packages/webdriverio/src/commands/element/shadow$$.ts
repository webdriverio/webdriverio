import { shadowFnFactory } from '../../scripts/shadowFnFactory'

/**
 *
 * Access elements inside a given element's shadowRoot.
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
 * an alternative approach to `shadow$$` is to use the [deep selector](https://webdriver.io/docs/selectors#deep-selectors).
 *
 * @alias element.shadow$$
 * @param {String|Function} selector  selector or JS Function to fetch a certain element
 * @return {ElementArray}
 * @type utility
 *
 */
export default async function shadowRoot (
    this: WebdriverIO.Element,
    selector: string
) {
    return await this.$$(shadowFnFactory(selector, true))
}
