/**
 * The `$$` command is a short way to call the [`findElements`](/docs/api/webdriver.html#findelements) command in order
 * to fetch multiple elements on the page similar to the `$$` command from the browser scope. The difference when calling
 * it from an element scope is that the driver will look within the children of that element.
 *
 * For more information on how to select specific elements, see [`Selectors`](/docs/selectors.html).
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
        const text = $('#menu');
        console.log(text.$$(function() { // Arrow function is not allowed here.
            // this is Element https://developer.mozilla.org/en-US/docs/Web/API/Element
            // in this particular example it is HTMLUListElement
            // TypeScript users may do something like this
            // return (this as Element).querySelectorAll('li')
            return this.querySelectorAll('li'); // Element[]
        })[2].$('a').getText()); // outputs: "API"
    });
 * </example>
 *
 * @alias $$
 * @param {String|Function|Matcher} selector  selector, JS Function, or Matcher object to fetch multiple elements
 * @return {ElementArray}
 * @type utility
 *
 */
import $$ from '../browser/$$'
export default $$
