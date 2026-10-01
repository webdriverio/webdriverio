import type { ElementReference } from '@wdio/protocols'

import { findElements, isElement, findElement } from '../../utils/index.js'
import { getElements, getElement } from '../../utils/getElementObject.js'
import { findDeepElements } from '../../utils/index.js'
import { ElementArray } from '../../element/array.js'
import { DEEP_SELECTOR } from '../../constants.js'
import type { Selector } from '../../types.js'

/**
 * `$$` fetches every element that matches a selector. It returns a `WebdriverIO.ElementArray`
 * immediately: a real array (`Array.isArray` is `true`) that stays thenable until the query
 * finishes. `custom$$`, `react$$` and `shadow$$` return the same kind of list, including when
 * you call them on an element (`$('parent').$$('child')`).
 *
 * Await the list when you want it resolved. `length` is then a number, each index is an element,
 * and a normal `for...of` loop works:
 *
 * ```js
 * const buttons = await $$('button')
 * console.log(buttons.length) // 3
 *
 * for (const button of buttons) {
 *     console.log(await button.getText())
 * }
 * ```
 *
 * The query does not run until something reads the list (`await`, `for await`, `.length`, an index,
 * or an iterator method such as `map`). Until then:
 *
 * - `length` is a `Promise<number>`. Use `await $$('button').length`, not `$$('button').length > 0`.
 * - `$$('button')[0]` is a chainable element, so `await $$('button')[0].getText()` works without
 *   awaiting the list first.
 * - `for await (const button of $$('button'))` yields each element.
 * - `for (const button of $$('button'))` throws `Cannot synchronously iterate over an element list that has not resolved yet`.
 *   Await the list first, or use `for await`.
 *
 * An index past the end of the list waits and refetches until `waitforTimeout`, the same way a
 * missing single element does. That wait still happens after the list has resolved
 * (`const items = await $$('li'); await items[items.length]`). A [`slice`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice)
 * or a `filter` does not: `$$('li').slice(0, 2)[3]` stays outside that window, and an index past a
 * filtered list does not resolve to an element the filter excluded. `.at()` uses the same index
 * conversion as a plain array, so `.at(1.5)` is element 1 and `.at(NaN)` is element 0.
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
 * ### Iterating over elements
 *
 * The list also provides asynchronous versions of the `Array` iteration methods `forEach`, `map`,
 * `find`, `findIndex`, `some`, `every`, `filter` and `reduce`. They accept `async` callbacks and can be
 * called on `$$` directly. `filter` and `filterSeries` return a new `ElementArray`, so the selector and
 * the command that found the elements are kept:
 *
 * ```js
 * const texts = await $$('h3').map((h3) => h3.getText())
 *
 * for await (const img of $$('img')) {
 *     console.log(await img.getAttribute('src'))
 * }
 * ```
 *
 * Every method except `reduce` also has a `*Series` variant (`forEachSeries`, `mapSeries`, and so on).
 * The base method runs all callbacks **concurrently**, while the `*Series` variant runs **one callback at a
 * time**, in list order. `reduce` always runs one callback at a time. Use a `*Series` variant when the order
 * of your interactions with the page matters.
 *
 * The concurrent `find` and `findIndex` resolve with the first match to finish, which is not necessarily the
 * earliest match in the list, and the concurrent `find`, `findIndex`, `some` and `every` keep running the
 * remaining callbacks after the result is known. Use the `*Series` variant to get the earliest match and
 * stop there.
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
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector | ElementReference[] | WebdriverIO.Element[] | HTMLElement[]
): WebdriverIO.ElementArray {
    const metadata: {
        selector: Selector | ElementReference[] | WebdriverIO.Element[]
        foundWith: string
        parent: WebdriverIO.Element | WebdriverIO.Browser | WebdriverIO.MultiRemoteBrowser | WebdriverIO.MultiRemoteElement | WebdriverIO.BrowsingContext
        props: unknown[]
    } = {
        selector: selector as Selector,
        foundWith: '$$',
        parent: this,
        props: []
    }

    return ElementArray.fromAsyncCallback(async () => {
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
                    ? await globalThis.wdio.executeWithScope(command, this.elementId, selector) as unknown as ElementReference[]
                    : await globalThis.wdio.execute(command, selector) as unknown as ElementReference[]
                const elements = await getElements.call(this, selector as Selector, res)
                metadata.parent = this
                return elements
            }

            const res = await findDeepElements.call(this, selector)
            const elements = await getElements.call(this, selector as Selector, res)
            metadata.parent = getParent.call(this, res)
            return elements
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
                if ($el) {
                    res.push($el)
                }
            }
        }

        const elements = await getElements.call(this, selector as Selector, res)
        metadata.parent = getParent.call(this, res)
        return elements
    }, metadata)
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
