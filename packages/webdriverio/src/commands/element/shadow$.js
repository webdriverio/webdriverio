/**
 *
 * Access an element inside a given element's shadowRoot
 *
 * <example>
    :shadow$$.js
    it('should return an element inside a shadowRoot', () => {
        const innerEl = $('.input').shadow$('#innerEl');
        console.log(innerEl.getValue()); // outputs: 'test123'
    });
 * </example>
 *
 * @alias element.shadow$
 * @uses commands/$
 * @type action
 *
 */

import { shadowFnFactory } from '../../scripts/shadowFnFactory'

export default async function shadowRoot (selector) {
    return await this.$(shadowFnFactory(selector))
}
