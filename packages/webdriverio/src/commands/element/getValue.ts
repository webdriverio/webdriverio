import { getBrowserObject } from '@wdio/utils'

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
export function getValue<T>(this: WebdriverIO.Element): Promise<T>
export function getValue(this: WebdriverIO.Element): Promise<string>
export function getValue<T>(this: WebdriverIO.Element) {
    const browser = getBrowserObject(this)
    // `!this.isMobile` added to workaround https://github.com/appium/appium/issues/12218
    if (browser.isNativeContext) {
        return this.getElementAttribute(this.elementId, 'value') as Promise<string>
    }
    return this.getElementProperty(this.elementId, 'value') as Promise<T>
}
