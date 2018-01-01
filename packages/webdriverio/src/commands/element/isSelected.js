/**
 *
 * The given selector will return true or false whether or not an `<option>` or `<input>` element of type
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
    it('should detect if an element is selected', function () {
        var element = $('[value="Layla Terry"]');
        console.log(element.isSelected()); // outputs: true

        browser.selectByValue('#selectbox', 'Bill Gilbert');
        console.log(element.isSelected()); // outputs: false
    });
 * </example>
 *
 * @alias browser.isSelected
 * @param   {String}             selector  option element or input of type checkbox or radio
 * @return {Boolean|Boolean[]}            true if element is selected
 * @uses protocol/elements, protocol/elementIdSelected
 * @type state
 *
 */

export default function isSelected() {
    return this.isElementSelected(this.elementId)
}
