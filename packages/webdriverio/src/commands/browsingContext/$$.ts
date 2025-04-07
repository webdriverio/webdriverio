import type { ElementReference } from '@wdio/protocols'

import { enhanceElementsArray } from '../../utils/index.js'
import { getElements, getElement } from '../../utils/getElementObject.js'
import { findDeepElements } from '../../utils/index.js'
import type { Selector } from '../../types.js'

/**
 * The `$$` command is a short and handy way in order to fetch multiple elements on the page.
 * It returns a `ChainablePromiseArray` containing a set of WebdriverIO elements.
 *
 * Using the wdio testrunner this command is a global variable, see [Globals](https://webdriver.io/docs/api/globals)
 * for more information. Using WebdriverIO within a [standalone](https://webdriver.io/docs/setuptypes#standalone-mode)
 * script it will be located on the browser object instead (e.g. `browser.$$`).
 *
 * You can chain `$` or `$$` together without wrapping individual commands into `await` in order
 * to walk down the DOM tree, e.g.:
 *
 * ```js
 * const imageSrc = await $$('div')[1].nextElement().$$('img')[2].getAttribute('src')
 * ```
 *
 * It is also possible to use async iterators to loop over the result of the query, e.g.:
 *
 * ```js
 * const context = await browser.url('https://www.webdriver.io')
 * // print all image sources
 * for await (const img of context.$$('img')) {
 *   console.log(await img.getAttribute('src'))
 * }
 * ```
 *
 * :::info
 *
 * For more information on how to select specific elements, check out the [Selectors](/docs/selectors) guide.
 *
 * :::
 *
 * @alias $$
 * @param {String|Function} selector  selector or JS Function to fetch multiple elements
 * @return {WebdriverIO.ElementArray}
 * @type utility
 *
 */
export async function $$ (
    this: WebdriverIO.BrowsingContext,
    selector: Selector | ElementReference[] | WebdriverIO.Element[] | HTMLElement[]
): Promise<WebdriverIO.ElementArray> {
    const res = await findDeepElements.call(this, selector)
    const elements = await getElements.call(this, selector as Selector, res)
    return enhanceElementsArray(elements, getParent.call(this, res), selector as Selector) as WebdriverIO.ElementArray
}

function getParent (this: WebdriverIO.BrowsingContext, res: ElementReference[]) {
    /**
     * Define scope of element. In most cases it is `this` but if we pass through
     * an element object from the browser runner we have to look into the parent
     * provided by the selector object. Since these objects are passed through
     * as raw objects without any prototype we have to check if the `$` or `$$`
     * is defined on the object itself and if not, create a new element object.
     */
    let parent = res.length > 0 ? (res[0] as WebdriverIO.Element).parent || this : this
    if (!('$' in parent) || typeof parent.$ === 'undefined') {
        parent = 'selector' in parent
            ? getElement.call(this, parent.selector, parent)
            : this
    }

    return parent
}
