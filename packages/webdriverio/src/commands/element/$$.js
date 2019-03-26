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
 * @param {String|Function} selector  selector or JS Function to fetch multiple elements
 * @return {Element[]}
 * @type utility
 *
 */
import { webdriverMonad } from 'webdriver'
import { wrapCommand, runFnInFiberContext } from '@wdio/config'
import merge from 'lodash.merge'

import { getPrototype as getWDIOPrototype} from '../../utils'
import { elementErrorHandler } from '../../middlewares'
import { ELEMENT_KEY } from '../../constants'
import {
    findElements,
    getBrowserObject,
    getElementFromResponse
} from '../../find-strategy'

export default async function $$ (selector) {
    const res = await findElements.call(this, selector)
    const browser = getBrowserObject(this)
    const prototype = merge({}, browser.__propertiesObject__, getWDIOPrototype('element'), { scope: 'element' })

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

        const elementInstance = element(this.sessionId, elementErrorHandler(wrapCommand))

        const origAddCommand = ::elementInstance.addCommand
        elementInstance.addCommand = (name, fn) => {
            browser.__propertiesObject__[name] = { value: fn }
            origAddCommand(name, runFnInFiberContext(fn))
        }
        return elementInstance
    })

    return elements
}
