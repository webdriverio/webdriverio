import { foreignContextId } from '../../session/browsingContext.js'

/**
 *
 * Get the value of a `<textarea>`, `<select>` or text `<input>` found by given selector.
 * If multiple elements are found via the given selector, an array of values is returned instead.
 * For input with checkbox or radio type use isSelected.
 *
 * <example>
    :index.html
    <input type="text" value="John Doe" id="username">
    :getValue.js
    it('should demonstrate the getValue command', async () => {
        const inputUser = await $('#username');
        const value = await inputUser.getValue();
        console.log(value); // outputs: "John Doe"
    });
 * </example>
 *
 * @alias element.getValue
 * @return {String}  requested element(s) value
 * @uses protocol/elements, protocol/elementIdProperty
 *
 */
export async function getValue (this: WebdriverIO.Element): Promise<string> {
    if (await foreignContextId(this)) {
        const value = await this.execute((el: HTMLInputElement) => el.value)
        return typeof value === 'string' ? value : ''
    }
    const value = this.getElementProperty(this.elementId, 'value')

    return value.then((res) => typeof res === 'string' ? res : '')
}
