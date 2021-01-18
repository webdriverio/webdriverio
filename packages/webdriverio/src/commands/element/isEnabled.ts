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
    it('should detect if an element is enabled', () => {
        let elem = $('.input1')
        let isEnabled = elem.isEnabled();
        console.log(isEnabled); // outputs: true

        elem = $('.input2')
        isEnabled = elem.isEnabled();
        console.log(isEnabled2); // outputs: false

        elem = $('.input3')
        isEnabled = elem.isEnabled();
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
export default function isEnabled (this: WebdriverIO.Element) {
    return this.isElementEnabled(this.elementId)
}
