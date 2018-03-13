/**
 * The `$$` command is a short way to call the [`elements`](/api/protocol/elements.html) command in order
 * to fetch multiple elements on the page. It returns an array with element results that will have an
 * extended prototype to call action commands without passing in a selector. However if you still pass
 * in a selector it will look for that element first and call the action on that element.
 *
 * Using the wdio testrunner this command is a global variable else it will be located on the browser object instead.
 *
 * You can chain `$` or `$$` together in order to walk down the DOM tree.
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
    it('should get text a menu link', function () {
        var text = $('#menu');
        console.log(text.$$('li')[2].$('a').getText()); // outputs: "API"
        // same as
        console.log(text.$$('li')[2].getText('a'));
    });
 * </example>
 *
 * @alias $$
 * @param {String} selector  selector to fetch multiple elements
 * @type utility
 *
 */
import { webdriverMonad, getPrototype as getWebdriverPrototype } from 'webdriver'
import { wrapCommand } from 'wdio-config'

import { findStrategy, getPrototype as getWDIOPrototype, getElementFromResponse } from '../../utils'
import { elementErrorHandler } from '../../middlewares'

export default async function $$ (selector) {
    const { using, value } = findStrategy(selector)
    const res = await this.findElementsFromElement(this.elementId, using, value)
    const prototype = Object.assign(getWebdriverPrototype(), getWDIOPrototype('element'), { scope: 'element' })

    const elements = res.map((res, i) => {
        const element = webdriverMonad(this.options, (client) => {
            const elementId = getElementFromResponse(res)

            if (elementId) {
                client.elementId = elementId
            } else {
                client.error = res
            }

            client.parent = this
            client.selector = selector
            client.index = i
            client.emit = ::this.emit
            return client
        }, prototype)

        return element(this.sessionId, elementErrorHandler(wrapCommand))
    })

    return elements
}
