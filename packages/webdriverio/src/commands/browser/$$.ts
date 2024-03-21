import type { ElementReference } from '@wdio/protocols'

import { findElements, enhanceElementsArray, isElement, findElement } from '../../utils/index.js'
import { getElements, getElement } from '../../utils/getElementObject.js'
import { findDeepElements } from '../../utils/index.js'
import { DEEP_SELECTOR } from '../../constants.js'
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
 * // print all image sources
 * for await (const img of $$('img')) {
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
 * @return {ElementArray}
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/example.html
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/multipleElements.js#L6-L7
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/multipleElements.js#L15-L24
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/multipleElements.js#L32-L39
 * @type utility
 *
 */
export async function $$ (
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector | ElementReference[] | WebdriverIO.Element[] | HTMLElement[]
): Promise<WebdriverIO.ElementArray> {
    /**
     * do a deep lookup if
     * - we are using Bidi
     * - have a string selector
     * - that is not a deep selector
     */
    if (this.isBidi && typeof selector === 'string' && !selector.startsWith(DEEP_SELECTOR)) {
        /**
         * run this in Node.js land if we are using browser runner
         */
        if (globalThis.wdio?.execute) {
            const command = '$$' as const
            const res = 'elementId' in this
                ? await globalThis.wdio.executeWithScope(command, this.elementId, selector) as any as ElementReference[]
                : await globalThis.wdio.execute(command, selector) as any as ElementReference[]
            const elements = await getElements.call(this, selector as Selector, res)
            return enhanceElementsArray(elements, this, selector as Selector) as WebdriverIO.ElementArray
        }

        const res = await findDeepElements.call(this, selector)
        const elements = await getElements.call(this, selector as Selector, res)
        return enhanceElementsArray(elements, getParent.call(this, res), selector as Selector) as WebdriverIO.ElementArray
    }

    let res: (ElementReference | Error)[] = Array.isArray(selector)
        ? selector as ElementReference[]
        : await findElements.call(this, selector)

    /**
     * allow user to transform a set of HTMLElements into a set of WebdriverIO elements
     */
    if (Array.isArray(selector) && isElement(selector[0])) {
        res = []
        for (const el of selector) {
            const $el = await findElement.call(this, el)
            $el && res.push($el)
        }
    }

    const elements = await getElements.call(this, selector as Selector, res)
    return enhanceElementsArray(elements, getParent.call(this, res), selector as Selector) as WebdriverIO.ElementArray
}

function getParent (this: WebdriverIO.Browser | WebdriverIO.Element, res: ElementReference[]) {
    /**
     * Define scope of element. In most cases it is `this` but if we pass through
     * an element object from the browser runner we have to look into the parent
     * provided by the selector object. Since these objects are passed through
     * as raw objects without any prototype we have to check if the `$` or `$$`
     * is defined on the object itself and if not, create a new element object.
     */
    let parent = res.length > 0 ? (res[0] as WebdriverIO.Element).parent || this : this
    if (typeof parent.$ === 'undefined') {
        parent = 'selector' in parent
            ? getElement.call(this, parent.selector, parent)
            : this
    }

    return parent
}
