import type { ElementReference } from '@wdio/protocols'

import { findElements, enhanceElementsArray, isElement, findElement } from '../../utils/index.js'
import { getElements } from '../../utils/getElementObject.js'
import type { Selector, ElementArray } from '../../types.js'

/**
 * The `$$` command is a short way to call the [`findElements`](/docs/api/webdriver#findelements) command in order
 * to fetch multiple elements on the page. It returns an array with element results that will have an
 * extended prototype to call action commands without passing in a selector. However if you still pass
 * in a selector it will look for that element first and call the action on that element.
 *
 * Using the wdio testrunner this command is a global variable else it will be located on the browser object instead.
 *
 * You can chain `$` or `$$` together in order to walk down the DOM tree.
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
