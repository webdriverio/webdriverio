/**
 *
 * Click on an element based on the given selector (unless the element is covered up).
 *
 * Note: This issues a Webdriver `click` command for the selected element, which generally scrolls to and then clicks the
 * selected element. However, if you have fixed-position elements (such as a fixed header or footer) that cover up the
 * selected element after it is scrolled within the viewport, the click will be issued at the given coordinates, but will
 * be received by your fixed (overlaying) element. In these cased the following error is thrown:
 *
 * ```
 * Element is not clickable at point (x, x). Other element would receive the click: ..."
 * ```
 *
 * To work around this, try to find the overlaying element and click on it via `execute` command. You also can try to scroll to the element yourself using `scroll` with an offset appropriate for your
 * scenario. If you find you frequently have to do this, creating a [custom command](/api/utility/addCommand.html) is helpful.
 *
 * <example>
    :example.html
    <button id="myButton" onclick="document.getElementById('someText').innerHTML='I was clicked'">Click me</button>
    <div id="someText">I was not clicked</div>

    :click.js
    it('should demonstrate the click command', function () {
        var myButton = $('#myButton')
        myButton.click()
        // or
        browser.click('#myButton')

        var text = browser.getText('#someText');
        assert(text === 'I was clicked'); // true
    })

    :example.js
    it('should fetch menu links and visit each page', function () {
        links = $$('#menu a');

        links.forEach(function (link) {
            link.click();
        });
    });
 * </example>
 *
 * @alias browser.click
 * @param {String} selector element to click on. If it matches with more than one DOM-element it automatically clicks on the first element
 * @uses protocol/element, protocol/elementIdClick
 * @type action
 *
 */

import { RuntimeError } from '../utils/ErrorHandler'

let click = function (selector) {
    return this.element(selector).then((elem) => {
        /**
         * check if element was found and throw error if not
         */
        if (!elem.value) {
            throw new RuntimeError(7)
        }

        return this.elementIdClick(elem.value.ELEMENT)
    })
}

export default click
