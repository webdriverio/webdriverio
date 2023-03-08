import { getElements } from '../../utils/getElementObject.js'
import { getBrowserObject, enhanceElementsArray } from '../../utils/index.js'
import { findStrategy } from '../../utils/findStrategy.js'
import { SHADOW_ELEMENT_KEY } from '../../constants.js'
import type { Selector, ElementArray } from '../../types.js'

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
    const browser = getBrowserObject(this)
    const shadowRoot = await browser.getElementShadowRoot(this.elementId)
    const { using, value } = findStrategy(selector as string, this.isW3C, this.isMobile)
    const res = await browser.findElementsFromShadowRoot(shadowRoot[SHADOW_ELEMENT_KEY], using, value)
    const elements = await getElements.call(this, selector as Selector, res)
    return enhanceElementsArray(elements, this, selector as Selector) as ElementArray
}
