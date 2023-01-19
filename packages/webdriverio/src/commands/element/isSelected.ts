/**
 *
 * Will return true or false whether or not an `<option>` or `<input>` element of type
 * checkbox or radio is currently selected.
 *
 * <example>
    :index.html
    <select name="selectbox" id="selectbox">
        <option value="John Doe">John Doe</option>
        <option value="Layla Terry" selected="selected">Layla Terry</option>
        <option value="Bill Gilbert">Bill Gilbert"</option>
    </select>

    :isSelected.js
    it('should detect if an element is selected', async () => {
        let element = await $('[value="Layla Terry"]');
        console.log(await element.isSelected()); // outputs: true

        element = await $('[value="Bill Gilbert"]')
        console.log(await element.isSelected()); // outputs: false
    });
 * </example>
 *
 * @alias element.isSelected
 * @return {Boolean} true if element is selected
 * @uses protocol/elements, protocol/elementIdSelected
 * @type state
 *
 */
export function isSelected (this: WebdriverIO.Element) {
    return this.isElementSelected(this.elementId)
}
