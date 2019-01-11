/**
 * The `$$` command is a short way to call the [`findElements`](/docs/api/webdriver.html#findelements) command in order
 * to fetch multiple elements on the page. It returns an array with element results that will have an
 * extended prototype to call action commands without passing in a selector. However if you still pass
 * in a selector it will look for that element first and call the action on that element.
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
        const text = $$('#menu')[0];
        console.log(text.$$('li')[2].$('a').getText()); // outputs: "API"
    });

    it('should get text a menu link - JS Function', () => {
        const text = $$(function() { // Arrow function is not allowed here.
            // this is Window https://developer.mozilla.org/en-US/docs/Web/API/Window
            // TypeScript users may do something like this
            // return (this as Window).document.querySelectorAll('#menu')
            return this.document.querySelectorAll('#menu'); // Element[]
        })[0];
        console.log(text.$$('li')[2].$('a').getText()); // outputs: "API"
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
import { wrapCommand } from '@wdio/config'

import { findElements, getPrototype as getWDIOPrototype, getElementFromResponse } from '../../utils'
import { elementErrorHandler } from '../../middlewares'
import { ELEMENT_KEY } from '../../constants'

export default async function $$ (selector) {
    const res = await findElements.call(this, selector)
    const prototype = Object.assign({}, this.__propertiesObject__, getWDIOPrototype('element'), { scope: 'element' })

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
            this.__propertiesObject__[name] = { value: fn }
            origAddCommand(name, fn)
        }
        return elementInstance
    })

    return elements
}
