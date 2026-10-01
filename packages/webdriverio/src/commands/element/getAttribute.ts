import { foreignContextId } from '../../session/browsingContext.js'

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
    it('should demonstrate the getAttribute command', async () => {
        const form = await $('form')
        const attr = await form.getAttribute('method')
        console.log(attr) // outputs: "post"
    })
 * </example>
 *
 * @alias element.getAttribute
 * @param {string} attributeName requested attribute
 * @return {String|null} The value of the attribute, or null if it is not set on the element.
 * @uses protocol/elements, protocol/elementIdAttribute
 * @type property
 *
 */
export async function getAttribute (
    this: WebdriverIO.Element,
    attributeName: string
) {
    if (await foreignContextId(this)) {
        const value = await this.execute((el: Element, name: string) => el.getAttribute(name), attributeName)
        return typeof value === 'string' ? value : null
    }
    return this.getElementAttribute(this.elementId, attributeName)
}
