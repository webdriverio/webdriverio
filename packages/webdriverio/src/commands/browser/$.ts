/**
 * The `$` command is a short way to call the [`findElement`](/docs/api/webdriver.html#findelement) command in order
 * to fetch a single element on the page. It returns an object that with an extended prototype to call
 * action commands without passing in a selector. However if you still pass in a selector it will look
 * for that element first and call the action on that element. You can also pass in an object as selector
 * where the object contains a property `element-6066-11e4-a52e-4f735466cecf` with the value of a reference
 * to an element. The command will then transform the reference to an extended WebdriverIO element.
 *
 * Using the wdio testrunner this command is a global variable else it will be located on the browser object instead.
 *
 * You can chain `$` or `$$` together in order to walk down the DOM tree. For more information on how
 * to select specific elements, see [`Selectors`](/docs/selectors.html).
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
    it('should get text a menu link', () => {
        const text = $('#menu');
        console.log(text.$$('li')[2].$('a').getText()); // outputs: "API"
    });

    it('should get text a menu link - JS Function', () => {
        const text = $(function() { // Arrow function is not allowed here.
            // this is Window https://developer.mozilla.org/en-US/docs/Web/API/Window
            // TypeScript users may do something like this
            // return (this as Window).document.querySelector('#menu')
            return this.document.querySelector('#menu'); // Element
        });
        console.log(text.$$('li')[2].$('a').getText()); // outputs: "API"
    });

    it('should allow to convert protocol result of an element into a WebdriverIO element', () => {
        const activeElement = browser.getActiveElement();
        console.log($(activeElement).getTagName()); // outputs active element
    });
 * </example>
 *
 * @alias $
 * @param {String|Function|Object} selector  selector or JS Function to fetch a certain element
 * @return {Element}
 * @type utility
 *
 */
import { findElement } from '../../utils'
import { getElement } from '../../utils/getElementObject'
import { ELEMENT_KEY } from '../../constants'
import type { Selector } from '../../types'

export default async function $ (
    this: WebdriverIO.BrowserObject,
    selector: Selector
) {
    /**
     * convert protocol result into WebdriverIO element
     * e.g. when element was fetched with `getActiveElement`
     */
    if (typeof selector === 'object' && typeof selector[ELEMENT_KEY] === 'string') {
        return getElement.call(this, undefined, selector)
    }

    const res = await findElement.call(this, selector)
    return getElement.call(this, selector as string, res)
}
