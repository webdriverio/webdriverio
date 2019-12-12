/**
 *
 * Get an attribute from a DOM-element based on the attribute name.
 *
 * <example>
    :index.html
    <form action="/submit" method="post" class="loginForm">
        <input type="text" name="name" placeholder="username"></input>
        <input type="text" name="password" placeholder="password"></input>
        <input type="submit" name="submit" value="submit"></input>
    </form>
    :getAttribute.js
    it('should demonstrate the getAttribute command', () => {
        const form = $('form')
        const attr = form.getAttribute('method')
        console.log(attr) // outputs: "post"
    })
 * </example>
 *
 * @alias element.getAttribute
 * @param {String} attributeName requested attribute
 * @return {String|null} The value of the attribute, or null if it is not set on the element.
 * @uses protocol/elements, protocol/elementIdAttribute
 * @type property
 *
 */

export default function getAttribute (attributeName) {
    return this.getElementAttribute(this.elementId, attributeName)
}
