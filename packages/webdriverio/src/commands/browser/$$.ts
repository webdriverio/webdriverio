import { findElements, enhanceElementsArray } from '../../utils/index.js'
import { getElements } from '../../utils/getElementObject.js'
import type { Selector, ElementArray } from '../../types'

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
 * <example>
    :index.html
    <ul id="menu">
        <li><a href="/">Home</a></li>
        <li><a href="/">Developer Guide</a></li>
        <li><a href="/">API</a></li>
        <li><a href="/">Contribute</a></li>
    </ul>
    :$.js
    it('should get text a menu link', async () => {
        const text = await $$('#menu')[0];
        console.log(await text.$$('li')[2].$('a').getText()); // outputs: "API"
    });

    it('should get text a menu link - JS Function', async () => {
        const text = await $$(function() { // Arrow function is not allowed here.
            // this is Window https://developer.mozilla.org/en-US/docs/Web/API/Window
            // TypeScript users may do something like this
            // return (this as Window).document.querySelectorAll('#menu')
            return this.document.querySelectorAll('#menu'); // Element[]
        })[0];
        console.log(await text.$$('li')[2].$('a').getText()); // outputs: "API"
    });
 * </example>
 *
 * @alias $$
 * @param {String|Function} selector  selector or JS Function to fetch multiple elements
 * @return {ElementArray}
 * @type utility
 *
 */
export default async function $$ (
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector
) {
    const res = await findElements.call(this, selector)
    const elements = await getElements.call(this, selector, res)
    return enhanceElementsArray(elements, this, selector) as ElementArray
}
