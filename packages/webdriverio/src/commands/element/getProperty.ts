import { foreignContextId } from '../../session/browsingContext.js'

/**
 * The Get Element Property command will return the result of getting a property of an
 * element.
 *
 * <example>
    :getProperty.js
    it('should demonstrate the getProperty command', async () => {
        var elem = await $('body')
        var tag = await elem.getProperty('tagName')
        console.log(tag) // outputs: "BODY"
    })
 * </example>
 *
 * @alias element.getProperty
 * @param {string} property  name of the element property
 * @return {unknown} the value of the property of the selected element
 */
export async function getProperty (
    this: WebdriverIO.Element,
    property: string
): Promise<unknown> {
    /**
     * Classic Get Element Property only sees the session pointer's document.
     * An element found in another browsing context is read there instead.
     */
    if (await foreignContextId(this)) {
        return this.execute((el: Element, name: string) => {
            return (el as unknown as Record<string, unknown>)[name]
        }, property)
    }
    return this.getElementProperty(this.elementId, property)
}
