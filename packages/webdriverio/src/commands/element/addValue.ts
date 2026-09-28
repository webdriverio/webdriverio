import type { InputOptions } from '../../types.js'
import { CommandRuntimeOptions } from 'webdriver'

const VALID_TYPES = ['string', 'number']

/**
 *
 * Add a value to an input or textarea element found by given selector.
 *
 * :::info
 *
 * If you like to use special characters, e.g. to copy and paste a value from one input to another, use the
 * [`keys`](/docs/api/browser/keys) command with the [`Key`](/docs/api/modules#key) object.
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
 * @param {InputOptions} additional options, exclusive to Webdriverio
 *
 */
export function addValue (
    this: WebdriverIO.Element,
    value: string | number,
    options?: InputOptions
) {
    /**
     * `elementSendKeys` accepts a string. Reject other types so callers use
     * the `keys` command for special characters.
     */
    if (!VALID_TYPES.includes(typeof value)) {
        throw new Error(
            'The setValue/addValue command only take string or number values. ' +
            'If you like to use special characters, use the "keys" command.'
        )
    }

    if (options) {
        // @ts-ignore bypassing typing to pass the third parameter until we can find a better solution
        return this.elementSendKeys(this.elementId, value.toString(), new CommandRuntimeOptions(options))
    }
    // Have this call separated so at least one of the two code lines is typed checked
    return this.elementSendKeys(this.elementId, value.toString())
}
