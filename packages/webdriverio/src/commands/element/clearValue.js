/**
 *
 * Clear a `<textarea>` or text `<input>` element’s value. Make sure you can interact with the
 * element before using this command. You can't clear an input element that is disabled or in
 * readonly mode.
 *
 * <example>
    :clearValue.js
    it('should demonstrate the clearValue command', function () {
        const elem = $('.input')
        elem.setValue('test123')

        const value = elem.getValue()
        console.log(value) // returns 'test123'

        elem.clearValue()
        value = elem.getValue()
        assert(value === ''); // true
    })
 * </example>
 *
 * @alias element.clearValue
 * @uses protocol/elements, protocol/elementIdClear
 * @type action
 *
 */

export default function clearValue () {
    return this.elementClear(this.elementId)
}
