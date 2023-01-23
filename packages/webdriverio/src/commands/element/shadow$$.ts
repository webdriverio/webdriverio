import { shadowFnFactory } from '../../scripts/shadowFnFactory.js'

/**
 *
 * Access elements inside a given element's shadowRoot. If you are working
 * with lots of nested shadow roots, an alternative approach to `shadow$$`
 * is to use the [deep selector](https://webdriver.io/docs/selectors#deep-selectors).
 *
 * <example>
    :shadow$$.js
    it('should return elements inside a shadowRoot', async () => {
        const innerEl = await $('.input').shadow$$('#innerEl');
        console.log(await innerEl.getValue()); // outputs: 'test123'
    });
 * </example>
 *
 * @alias element.shadow$$
 * @param {String|Function} selector  selector or JS Function to fetch a certain element
 * @return {ElementArray}
 * @type utility
 *
 */
export async function shadow$$ (
    this: WebdriverIO.Element,
    selector: string
) {
    return await this.$$(shadowFnFactory(selector, true))
}
