import type { ChainablePromiseElement } from '../../types.js'

/**
 *
 * Access `WebdriverIO.Element` properties like `selector` or `elementId` from the element reference.
 *
 * <example>
    :getElement.ts
    it('should allow me to inspect WebdriverIO.Element properties', async () => {
        const elem = await $('#elem').getElement();
        console.log(elem.selector); // outputs: '#elem'
    });
 * </example>
 *
 * @alias element.getElement
 * @return {Element}
 * @type utility
 *
 */
export async function getElement (this: WebdriverIO.Element | ChainablePromiseElement<WebdriverIO.Element>): Promise<WebdriverIO.Element> {
    return this as WebdriverIO.Element
}
