import type { ElementReference } from '@wdio/protocols'

import { findElements, enhanceElementsArray, isElement, findElement } from '../../utils/index.js'
import { getElements } from '../../utils/getElementObject.js'
import type { Selector, ElementArray } from '../../types.js'

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
 * const imageSrc = await $$('div')[1].nextElement().$$('img')[2].getAttribute('src)
 * ```
 *
 * It is also possible to use async iterators to loop over the result of the query, e.g.:
 *
 * ```js
 * // print all image sources
 * for await (const img of $$('img')) {
 *   console.log(await img.getAttribute('src))
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
) {
    let res: (ElementReference | Error)[] = Array.isArray(selector)
        ? selector as ElementReference[]
        : await findElements.call(this, selector)

    /**
     * allow user to transform a set of HTMLElements into a set of WebdriverIO elements
     */
    if (Array.isArray(selector) && isElement(selector[0])) {
        res = []
        for (const el of selector) {
            res.push(await findElement.call(this, el))
        }
    }

    const elements = await getElements.call(this, selector as Selector, res)
    return enhanceElementsArray(elements, this, selector as Selector) as ElementArray
}
