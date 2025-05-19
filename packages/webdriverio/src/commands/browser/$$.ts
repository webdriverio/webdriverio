import type { ElementReference } from '@wdio/protocols'

import { findElements, isElement, findElement } from '../../utils/index.js'
import { getElements } from '../../utils/getElementObject.js'
import { findDeepElements } from '../../utils/index.js'
import { ElementArray } from '../../element/array.js'
import { DEEP_SELECTOR } from '../../constants.js'
import type { Selector } from '../../types.js'

/**
 * The `$$` command is a short and handy way in order to fetch multiple elements on the page.
 * It returns a `WebdriverIO.ElementArray` containing an array of WebdriverIO elements.
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
 * @return {WebdriverIO.ElementArray}
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/example.html
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/multipleElements.js#L6-L7
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/multipleElements.js#L15-L24
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/multipleElements.js#L32-L39
 * @type utility
 *
 */
export function $$ (
    this: unknown,
    selector: Selector | ElementReference[] | WebdriverIO.Element[] | HTMLElement[]
): WebdriverIO.ElementArray {
    const self = this as WebdriverIO.Browser | WebdriverIO.Element

    /**
     * do a deep lookup if
     * - we are using Bidi
     * - have a string selector
     * - that is not a deep selector
     */
    if (self.isBidi && typeof selector === 'string' && !selector.startsWith(DEEP_SELECTOR)) {
        /**
         * run this in Node.js land if we are using browser runner
         */
        if (globalThis.wdio?.execute) {
            const command = '$$' as const
            return ElementArray.fromAsyncCallback(async () => {
                const res = 'elementId' in self
                    ? await globalThis.wdio.executeWithScope(command, self.elementId, selector) as unknown as ElementReference[]
                    : await globalThis.wdio.execute(command, selector) as unknown as ElementReference[]
                const elements = await getElements.call(self, selector as Selector, res)
                return elements
            }, {
                selector: selector as Selector,
                foundWith: '$$',
                parent: self
            })
        }

        return ElementArray.fromAsyncCallback(async () => {
            const res = await findDeepElements.call(self, selector)
            const elements = await getElements.call(self, selector as Selector, res)
            return elements
        }, {
            selector: selector as Selector,
            foundWith: '$$',
            parent: self
        })
    }

    return ElementArray.fromAsyncCallback(async () => {
        let res: (ElementReference | Error)[] = Array.isArray(selector)
            ? selector as ElementReference[]
            : await findElements.call(self, selector)

        /**
         * allow user to transform a set of HTMLElements into a set of WebdriverIO elements
         */
        if (Array.isArray(selector) && isElement(selector[0])) {
            res = []
            for (const el of selector) {
                const $el = await findElement.call(self, el)
                if ($el) {
                    res.push($el)
                }
            }
        }

        const elements = await getElements.call(self, selector as Selector, res)
        return elements
    }, {
        selector: selector as Selector,
        foundWith: '$$',
        parent: self
    })
}