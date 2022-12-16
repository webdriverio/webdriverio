/**
 *
 * Return true or false if the selected DOM-element is enabled.
 *
 * <example>
    :index.html
    <input type="text" name="inputField" class="input1">
    <input type="text" name="inputField" class="input2" disabled>
    <input type="text" name="inputField" class="input3" disabled="disabled">

    :isEnabled.js
    it('should detect if an element is enabled', async () => {
        let elem = await $('.input1')
        let isEnabled = await elem.isEnabled();
        console.log(isEnabled); // outputs: true

        elem = await $('.input2')
        isEnabled = await elem.isEnabled();
        console.log(isEnabled2); // outputs: false

        elem = await $('.input3')
        isEnabled = await elem.isEnabled();
        console.log(isEnabled3); // outputs: false
    });
 * </example>
 *
 * @alias element.isEnabled
 * @return {Boolean} true if element(s)* (is|are) enabled
 * @uses protocol/elements, protocol/elementIdEnabled
 * @type state
 *
 */
export function isEnabled (this: WebdriverIO.Element) {
    return this.isElementEnabled(this.elementId)
}
