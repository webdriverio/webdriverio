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

import { findElements, getPrototype as getWDIOPrototype, getElementFromResponse } from '../../utils'
import { elementErrorHandler } from '../../middlewares'
import { ELEMENT_KEY } from '../../constants'

export default async function $$ (selector) {
    const res = await findElements.call(this, selector)
    const prototype = Object.assign(getWebdriverPrototype(this.isW3C), getWDIOPrototype('element'), { scope: 'element' })

    const elements = res.map((res, i) => {
        const element = webdriverMonad(this.options, (client) => {
            const elementId = getElementFromResponse(res)

            if (elementId) {
                /**
                 * set elementId for easy access
                 */
                client.elementId = elementId

                /**
                 * set element id with proper key so element can be passed into execute commands
                 */
                if (this.isW3C) {
                    client[ELEMENT_KEY] = elementId
                } else {
                    client.ELEMENT = elementId
                }
            } else {
                client.error = res
            }

            client.selector = selector
            client.parent = this
            client.index = i
            client.emit = ::this.emit
            return client
        }, prototype)

        return element(this.sessionId, elementErrorHandler(wrapCommand))
    })

    return elements
}
