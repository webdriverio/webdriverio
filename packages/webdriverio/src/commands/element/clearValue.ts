/**
 *
 * Clear the value of an input or textarea element. Make sure you can interact with the
 * element before using this command. You can't clear an input element that is disabled or in
 * readonly mode.
 *
 * <example>
    :clearValue.js
    it('should demonstrate the clearValue command', async () => {
        const elem = await $('.input')
        await elem.setValue('test123')

        const value = await elem.getValue()
        console.log(value) // returns 'test123'

        await elem.clearValue()
        value = await elem.getValue()
        assert(value === ''); // true
    })
 * </example>
 *
 * @alias element.clearValue
 * @uses protocol/elements, protocol/elementIdClear
 * @type action
 *
 */
export function clearValue (this: WebdriverIO.Element) {
    return this.elementClear(this.elementId)
}
