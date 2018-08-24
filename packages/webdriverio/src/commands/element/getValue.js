/**
 *
 * Get the value of a `<textarea>`, `<select>` or text `<input>` found by given selector.
 * If multiple elements are found via the given selector, an array of values is returned instead.
 *
 * <example>
    :index.html
    <input type="text" value="John Doe" id="username">
    :getValue.js
    it('should demonstrate the getValue command', () {
        const inputUser = $('#username');
        const value = inputUser.getValue();
        console.log(value); // outputs: "John Doe"
    });
 * </example>
 *
 * @alias browser.getValue
 * @param  {String} selector  input, textarea, or select element
 * @return {String|String[]}  requested element(s) value
 * @uses protocol/elements, protocol/elementIdProperty
 * @type property
 *
 */

export default function getValue () {
    if (this.isW3C) {
        return this.getElementProperty(this.elementId, 'value')
    }

    return this.getElementAttribute(this.elementId, 'value')
}