import logger from '@wdio/logger'
import { SHADOW_ELEMENT_KEY } from 'webdriver'

import { shadowFnFactory } from '../../scripts/shadowFnFactory.js'
import { getElement } from '../../utils/getElementObject.js'
import { getBrowserObject } from '@wdio/utils'
import { findStrategy } from '../../utils/findStrategy.js'

const log = logger('webdriverio')

/**
 *
 * Access an element inside a given element's shadowRoot. If you are working
 * with lots of nested shadow roots, an alternative approach to `shadow$` is
 * to use the [deep selector](https://webdriver.io/docs/selectors#deep-selectors).
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
    it('should return an element inside a shadowRoot', async () => {
        const innerEl = await $('custom-component').shadow$('#innerEl');
        console.log(await innerEl.getValue()); // outputs: 'test123'
    });
 * </example>
 *
 * @alias element.shadow$
 * @param {String|Function} selector  selector or JS Function to fetch a certain element
 * @return {WebdriverIO.Element}
 * @type utility
 *
 */
export async function shadow$ (
    this: WebdriverIO.Element,
    selector: string
) {
    const browser = getBrowserObject(this)
    try {
        const shadowRoot = await browser.getElementShadowRoot(this.elementId)
        const { using, value } = findStrategy(selector as string, this.isW3C, this.isMobile)
        const res = await browser.findElementFromShadowRoot(shadowRoot[SHADOW_ELEMENT_KEY], using, value)
        return getElement.call(this, selector as string, res, { isShadowElement: true })
    } catch (err) {
        log.warn(
            `Failed to fetch element within shadow DOM using WebDriver command: ${(err as Error).message}!\n` +
            'Falling back to JavaScript shim.'
        )
        return this.$(shadowFnFactory(selector))
    }
}
