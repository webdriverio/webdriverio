import { ELEMENT_KEY } from 'webdriver'
import type { ElementReference } from '@wdio/protocols'

import { ARIA_SELECTOR, DEEP_SELECTOR } from '../../constants.js'
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
    selector: Selector
): Promise<WebdriverIO.Element> {
    /**
     * run this in Node.js land if we are using browser runner because we collect
     * more browser information there that allows better lookups
     */
    if (globalThis.wdio && typeof selector === 'string' && !selector.startsWith(DEEP_SELECTOR)) {
        /**
         * `res` is an element reference as we strip down the element
         * result to its element id
         */
        const res: ElementReference = 'elementId' in this
            ? await globalThis.wdio.executeWithScope('$' as const, this.elementId, selector)
            : await globalThis.wdio.execute('$' as const, selector)
        return getElement.call(this, selector as string, res)
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

    /**
     * Finds elements when aria label is received by other elements with aria-labelledby or aria-describedby
     * originally implemented as a xpath query, but it was slow.
     * See: https://github.com/webdriverio/webdriverio/issues/14662
     * https://www.w3.org/TR/accname-1.1/#step2B
     */
    if (typeof selector === 'string' && selector.startsWith(ARIA_SELECTOR)) {
        const label = selector.slice(ARIA_SELECTOR.length)

        // replaces selector with a fn we have to bake the label into the
        // function so that it can be used in the browser context
        const fn = function() {
            /* eslint-disable */
            // @ts-ignore
            // TODO: import? but how? used in the browser context
            const getComputedLabel = (element) => {
                if (element) {
                    // The element's `aria-labelledby
                    const ariaLabelledby = element.getAttribute("aria-labelledby");
                    if (ariaLabelledby) {
                        const ariaLabelledbyElement = document.getElementById(ariaLabelledby);
                        if (ariaLabelledbyElement) {
                            const ariaLabelledbyElementText = ariaLabelledbyElement.innerText;
                            if (ariaLabelledbyElementText) return ariaLabelledbyElementText;
                        }
                    }

                    // The element's `aria-label`
                    const ariaLabel = element.getAttribute("aria-label");
                    if (ariaLabel) return ariaLabel;

                    // If it's an image/etc., alternate text
                    // Even if it's an empty alt attribute alt=""
                    if (
                    element.tagName === "APPLET" ||
                    element.tagName === "AREA" ||
                    element.tagName === "IMG" ||
                    element.tagName === "INPUT"
                    ) {
                        const altText = element.getAttribute("alt");
                        if (typeof altText === "string") return altText;
                    }

                    // <desc> for SVGs
                    if (element.tagName === "SVG") {
                        const descElt = element.querySelector("desc");
                        if (descElt) {
                            const descText =
                                descElt.innerText || descElt.innerHTML;
                            if (descText) return descText;
                        }
                    }

                    // The value of the element
                    const innerText = element.innerText;
                    if (innerText) return innerText;
                }
            };
            const allElements = Array.from(document.querySelectorAll('*')).filter(el => {
                // Skip labels
                if (el.tagName.toLowerCase() === 'label') {
                    return false
                }

                // Get text from direct text nodes only
                const textNodes = Array.from(el.childNodes).filter(n => n.nodeType === Node.TEXT_NODE);
                const combinedText = textNodes.map(n => n.textContent?.trim()).join('').trim();

                return Boolean(combinedText);
            })
            const allLabels = allElements.map(getComputedLabel)
            const matchIdx = allLabels.findIndex(labelText => labelText === '##LABEL##')
            if (matchIdx > -1) {
                return allElements[matchIdx]
            }
            /* eslint-enable */
        }.toString().replace('##LABEL##', label)

        selector = new Function(`return (${fn})`)() as Selector
    }

    const res = await findElement.call(this, selector)
    return getElement.call(this, selector as string, res)
}
