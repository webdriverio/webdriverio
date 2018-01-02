/**
 *
 * Clear a `<textarea>` or text `<input>` element’s value. Make sure you can interact with the
 * element before using this command. You can't clear an input element that is disabled or in
 * readonly mode.
 *
 * <example>
    :clearElement.js
    it('should demonstrate the clearElement command', function () {
        var input = $('.input')
        input.setValue('test123')
        console.log(input.getValue()) // returns 'test123'
        input.clearElement()
        // or
        browser.clearElement('.input')
        var value = browser.getValue('.input')
        assert(value === ''); // true
    })
 * </example>
 *
 * @alias browser.clearElement
 * @param {String} selector input element
 * @uses protocol/elements, protocol/elementIdClear
 * @type action
 *
 */

export default function clearElement () {
    return this.elementClear(this.elementId)
}
