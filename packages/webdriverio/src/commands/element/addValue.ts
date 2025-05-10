import type { WdioOptions } from 'src/types.js'
import type { CommandRuntimeOptions } from 'webdriver'

const VALID_TYPES = ['string', 'number']

/**
 *
 * Add a value to an input or textarea element found by given selector.
 *
 * :::info
 *
 * If you like to use special characters, e.g. to copy and paste a value from one input to another, use the
 * [`keys`](/docs/api/browser/keys) command.
 *
 * :::
 *
 * <example>
    :addValue.js
    it('should demonstrate the addValue command', async () => {
        let input = await $('.input')
        await input.addValue('test')
        await input.addValue(123)

        value = await input.getValue()
        assert(value === 'test123') // true
    })
 * </example>
 *
 * @alias element.addValue
 * @param {string|number}  value  value to be added
 * @param {WdioOptions} options additional exclusive to webdriverio
 *
 */
export function addValue (
    this: WebdriverIO.Element,
    value: string | number,
    options: WdioOptions = {}
) {
    /**
     * The JSONWireProtocol allowed array values and use of special characters when adding a value to an input.
     * With the W3C protocol this was not possible anymore. This is a type check to ensure users are aware of
     * this transition.
     */
    if (!VALID_TYPES.includes(typeof value)) {
        throw new Error(
            'The setValue/addValue command only take string or number values. ' +
            'If you like to use special characters, use the "keys" command.'
        )
    }

    if (options.mask) {
        // @ts-ignore bypassing typing until we can find a better solution
        return this.elementSendKeys(this, value.toString(), options satisfies CommandRuntimeOptions)
    }
    return this.elementSendKeys(this.elementId, value.toString())
}
