/**
 *
 * Clear a `<textarea>` or text `<input>` element’s value. Make sure you can interact with the
 * element before using this command. You can't clear an input element that is disabled or in
 * readonly mode.
 *
 * <example>
    :clearElement.js
    it('should demonstrate the clearElement command', function () {
        let elem = browser.$('.input')
        elem.setValue('test123')

        let value = elem.getValue() 
        console.log(value) // returns 'test123'
        
        elem.clearElement()
        value = elem.getValue()
        assert(value === ''); // true
    })
 * </example>
 *
 * @alias browser.clearElement
 * @uses protocol/elements, protocol/elementIdClear
 * @type action
 *
 */

export default function clearElement () {
    return this.elementClear(this.elementId)
}
