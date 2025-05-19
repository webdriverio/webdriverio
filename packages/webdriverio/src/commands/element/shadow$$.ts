import { getBrowserObject } from '@wdio/utils'
import { SHADOW_ELEMENT_KEY } from 'webdriver'

import { getElements } from '../../utils/getElementObject.js'
import { ElementArray } from '../../element/array.js'
import { findStrategy } from '../../utils/findStrategy.js'
import type { Selector } from '../../types.js'

/**
 *
 * Access elements inside a given element's shadowRoot. If you are working
 * with lots of nested shadow roots, an alternative approach to `shadow$$`
 * is to use the [deep selector](https://webdriver.io/docs/selectors#deep-selectors).
 *
 * :::info
 *
 * WebdriverIO automatically pierces through shadow roots when using `$` or `$$` commands.
 * This command is only needed if you automate within an environment that doesn't
 * support WebDriver Bidi yet, e.g. mobile web testing with Appium.
 *
 * :::
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
 * @return {WebdriverIO.ElementArray}
 * @type utility
 *
 */
export function shadow$$ (
    this: WebdriverIO.Element,
    selector: string
): WebdriverIO.ElementArray {
    const browser = getBrowserObject(this)

    return ElementArray.fromAsyncCallback(async () => {
        const shadowRoot = await browser.getElementShadowRoot(this.elementId)
        const { using, value } = findStrategy(selector as string, this.isW3C, this.isMobile)
        const res = await browser.findElementsFromShadowRoot(shadowRoot[SHADOW_ELEMENT_KEY], using, value)
        const elements = await getElements.call(this, selector as Selector, res, { isShadowElement: true })
        return elements
    }, {
        selector,
        foundWith: 'shadow$$',
        parent: this
    })
}
