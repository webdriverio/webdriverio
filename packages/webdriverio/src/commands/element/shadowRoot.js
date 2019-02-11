/**
 *
 * Access an element's shadowRoot if it exists
 *
 * <example>
    :shadowRoot.js
    it('should interact with shadowRoot as an Element', () => {
        const input = $('.input');
        const root = input.shadowRoot();
        const innerEl = root.$('#innerEl');

        console.log(innerEl.getValue()); // outputs: 'test123'
    });
 * </example>
 *
 * @alias element.shadowRoot
 * @uses protocol/elements, protocol/elementIdClear, protocol/elementIdValue
 * @type action
 *
 */

import { webdriverMonad } from 'webdriver'
import { wrapCommand, runFnInFiberContext } from '@wdio/config'
import merge from 'lodash.merge'

import { getBrowserObject, getPrototype as getWDIOPrototype, getElementFromResponse } from '../../utils'
import { elementErrorHandler } from '../../middlewares'
import { ELEMENT_KEY } from '../../constants'

export default async function shadowRoot () {
    // get the shadowRoot property, or the element if not found
    const root = await this.execute((el) => el.shadowRoot ? el.shadowRoot : el, this)
    if (!root) {
        // would this ever happen?
        return null
    }

    // wrap root as an element
    const browser = getBrowserObject(this)
    const prototype = merge({}, browser.__propertiesObject__, getWDIOPrototype('element'), { scope: 'element' })
    const element = webdriverMonad(this.options, (client) => {
        const elementId = getElementFromResponse(root)
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
            client.error = root
        }

        // client.selector = selector // JR: we don't have a selector?!
        client.parent = this
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
}
