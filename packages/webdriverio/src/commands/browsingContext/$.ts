import { ELEMENT_KEY } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { findElement } from '../../utils/index.js'
import { getElement } from '../../utils/getElementObject.js'
import type { Selector } from '../../types.js'

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
        const context = await browser.url('https://www.webdriver.io')
        const menuItem = await context.$({
            "name": "hasEntry",
            "args": ["title", "ViewTitle"],
            "class": "androidx.test.espresso.matcher.ViewMatchers"
        });
        await menuItem.click();

        const menuItem = await context.$({
            "name": "hasEntry",
            "args": ["title", "ViewTitle"]
        });
        await menuItem.click();
    });
 * </example>
 *
 * @alias $
 * @param {String|Function|Matcher} selector  selector, JS Function, or Matcher object to fetch a certain element
 * @return {WebdriverIO.Element}
 * @type utility
 */
export async function $ (
    this: WebdriverIO.BrowsingContext,
    selector: Selector
): Promise<WebdriverIO.Element> {
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

    const res = await findElement.call(this, selector)
    return getElement.call(this, selector as string, res)
}
