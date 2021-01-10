import { ELEMENT_KEY } from '../../constants'
import { getBrowserObject } from '../../utils'
import isFocusedScript from '../../scripts/isFocused'
import type { Element } from '../../types'

/**
 *
 * Return true or false if the selected DOM-element currently has focus. If the selector matches
 * multiple elements, it will return true if one of the elements has focus.
 *
 * <example>
    :index.html
    <input name="login" autofocus="" />
    :hasFocus.js
    it('should detect the focus of an element', () => {
        browser.url('/');
        const loginInput = $('[name="login"]');
        console.log(loginInput.isFocused()); // outputs: false

        loginInput.click();
        console.log(loginInput.isFocused()); // outputs: true
    })
 * </example>
 *
 * @alias element.isFocused
 * @return {Boolean}         true if one of the matching elements has focus
 *
 * @uses protocol/execute
 * @type state
 *
 */
export default async function isFocused (this: Element) {
    const browser = await getBrowserObject(this)
    return browser.execute(isFocusedScript, {
        [ELEMENT_KEY]: this.elementId, // w3c compatible
        ELEMENT: this.elementId // jsonwp compatible
    })
}
