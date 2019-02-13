/**
 *
 * Access an element inside a given element's shadowRoot
 *
 * <example>
    :shadow$$.js
    it('should return an element inside a shadowRoot', () => {
        const input = $('.input');
        const innerEl = input.shadow$('#innerEl');
        console.log(innerEl.getValue()); // outputs: 'test123'
    });
 * </example>
 *
 * @alias element.shadow$
 * @uses commands/$
 * @type action
 *
 */

// need to generate a function that includes the desired selector
const fnFactory = function(elementSelector) {
    const strFn = `(function() { return this.shadowRoot.querySelector('${elementSelector}') })`
    return eval(strFn)
}

export default async function shadowRoot (selector) {
    return await this.$(fnFactory(selector))
}
