import type { ChainablePromiseArray } from '../../types.js'

/**
 *
 * Access `WebdriverIO.ElementArray` properties like `length` or `selector` from the elements reference.
 *
 * <example>
    :getElements.ts
    it('should allow me to inspect WebdriverIO.Element properties', async () => {
        const divs = await $$('div').getElements();
        console.log(divs.length); // outputs: 43
    });
 * </example>
 *
 * @alias element.getElements
 * @return {WebdriverIO.ElementArray}
 * @type utility
 *
 */
export async function getElements (this: WebdriverIO.ElementArray | ChainablePromiseArray): Promise<WebdriverIO.ElementArray> {
    return this as WebdriverIO.ElementArray
}
