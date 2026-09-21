import { ELEMENT_KEY } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { DEEP_SELECTOR } from '../../constants.js'
import { findElement } from '../../utils/index.js'
import { findStrictElement, isCountableSelector, isStrictQuery, StrictSelectorError } from '../../utils/strictMode.js'
import { getElement } from '../../utils/getElementObject.js'
import type { ElementQueryOptions, Selector } from '../../types.js'

/**
 * The `$` command is a short and handy way in order to fetch a single element on the page.
 *
 * You can also pass in an object as selector where the object contains a property `element-6066-11e4-a52e-4f735466cecf`
 * with the value of a reference to an element. The command will then transform the reference to an extended WebdriverIO element.
 *
 * Note: chaining `$` and `$$` commands only make sense when you use multiple selector strategies. You will otherwise
 * make unnecessary requests that slow down the test (e.g. `$('body').$('div')` will trigger two request whereas
 * `$('body div')` does literally the same with just one request)
 *
 * __Note:__ only use these element objects if you are certain they still exist on the
 * page, e.g. using the `isExisting` command. WebdriverIO is unable to refetch them given
 * that there are no selector information available.
 *
 * As of v10 this command is __strict__: if the selector resolves to more than one element it throws a
 * `StrictSelectorError` rather than silently returning the first match. Use `$$` when you expect multiple
 * elements, pass `{ strict: false }` to opt out for a single call, or set `strictSelectors: false` in your
 * config to opt out globally. See the [Selectors](/docs/selectors#strict-mode) guide for details.
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
 * :::info
 *
 * For more information on how to select specific elements, check out the [Selectors](/docs/selectors) guide.
 *
 * :::
 *
 * <example>
    :$.js
    it('should use Androids DataMatcher or ViewMatcher selector', async () => {
        const menuItem = await $({
            "name": "hasEntry",
            "args": ["title", "ViewTitle"],
            "class": "androidx.test.espresso.matcher.ViewMatchers"
        });
        await menuItem.click();

        const menuItem = await $({
            "name": "hasEntry",
            "args": ["title", "ViewTitle"]
        });
        await menuItem.click();
    });
 * </example>
 *
 * @alias $
 * @param {String|Function|Matcher} selector  selector, JS Function, or Matcher object to fetch a certain element
 * @param {Object=}                 options          command options
 * @param {Boolean=}                options.strict   throw if the selector matches more than one element (default: the `strictSelectors` config option, which defaults to `true`)
 * @return {WebdriverIO.Element}
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/example.html
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/singleElements.js#L9-L10
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/singleElements.js#L16-L25
 * @example https://github.com/webdriverio/example-recipes/blob/59c122c809d44d343c231bde2af7e8456c8f086c/queryElements/singleElements.js#L42-L46
 * @type utility
 *
 */
export async function $ (
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector,
    options?: ElementQueryOptions
): Promise<WebdriverIO.Element> {
    const strict = isCountableSelector(selector) && isStrictQuery(this, options)

    /**
     * run this in Node.js land if we are using browser runner because we collect
     * more browser information there that allows better lookups
     */
    if (globalThis.wdio && typeof selector === 'string' && !selector.startsWith(DEEP_SELECTOR)) {
        /**
         * in strict mode we have to query all matches to be able to tell how
         * many elements the selector resolves to
         */
        if (strict) {
            const matches = ('elementId' in this
                ? await globalThis.wdio.executeWithScope('$$' as const, this.elementId, selector)
                : await globalThis.wdio.execute('$$' as const, selector)) as unknown as ElementReference[]

            if (matches.length > 1) {
                throw new StrictSelectorError(selector, matches.length)
            }

            return getElement.call(
                this,
                selector,
                matches[0] || new Error(`Couldn't find element with selector "${selector}"`),
                { strict }
            )
        }

        /**
         * `res` is an element reference as we strip down the element
         * result to its element id
         */
        const res: ElementReference = 'elementId' in this
            ? await globalThis.wdio.executeWithScope('$' as const, this.elementId, selector)
            : await globalThis.wdio.execute('$' as const, selector)
        return getElement.call(this, selector as string, res, { strict })
    }

    /**
     * convert protocol result into WebdriverIO element
     * e.g. when element was fetched with `getActiveElement`
     */
    if (typeof selector === 'object') {
        const elementRef = selector as ElementReference
        if (typeof elementRef[ELEMENT_KEY] === 'string') {
            return getElement.call(this, undefined, elementRef)
        }
    }

    const res = strict
        ? await findStrictElement.call(this, selector)
        : await findElement.call(this, selector)
    return getElement.call(this, selector as string, res, { strict })
}
