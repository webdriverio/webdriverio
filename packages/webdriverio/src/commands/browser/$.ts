import { findElement } from '../../utils/index.js'
import { getElement } from '../../utils/getElementObject.js'
import { ELEMENT_KEY } from '../../constants.js'
import type { Selector } from '../../types'
import type { ElementReference } from '@wdio/protocols'

/**
 * The `$` command is a short way to call the [`findElement`](/docs/api/webdriver#findelement) command in order
 * to fetch a single element on the page. It returns an object that with an extended prototype to call
 * action commands without passing in a selector. However if you still pass in a selector it will look
 * for that element first and call the action on that element.
 *
 * You can also pass in an object as selector where the object contains a property
 * `element-6066-11e4-a52e-4f735466cecf` with the value of a reference to an element.
 * The command will then transform the reference to an extended WebdriverIO element.
 * __Note:__ only use these element objects if you are certain they still exist on the
 * page, e.g. using the `isExisting` command. WebdriverIO is unable to refetch them given
 * that there are no selector information available.
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
        const text = await $('#menu');
        console.log(await text.$$('li')[2].$('a').getText()); // outputs: "API"
    });

    it('should get text a menu link - JS Function', async () => {
        const text = await $(function() { // Arrow function is not allowed here.
            // this is Window https://developer.mozilla.org/en-US/docs/Web/API/Window
            // TypeScript users may do something like this
            // return (this as Window).document.querySelector('#menu')
            return this.document.querySelector('#menu'); // Element
        });
        console.log(await text.$$('li')[2].$('a').getText()); // outputs: "API"
    });

    it('should allow to convert protocol result of an element into a WebdriverIO element', async () => {
        const activeElement = await browser.getActiveElement();
        console.log(await $(activeElement).getTagName()); // outputs active element
    });

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
 * @return {Element}
 * @type utility
 *
 */
export default async function $ (
    this: WebdriverIO.Browser | WebdriverIO.Element,
    selector: Selector
) {
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
