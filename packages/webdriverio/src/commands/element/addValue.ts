import logger from '@wdio/logger'
import { transformToCharString } from '../../utils/index.js'

const log = logger('addValue')

export type CommandOptions = {
    translateToUnicode?: boolean
}

export type Value = string | number

const isNumberOrString = (input: unknown) => typeof input === 'string' || typeof input === 'number'

const isValidType = (value: unknown) => (
    isNumberOrString(value) ||
    Array.isArray(value) && value.every((item) => isNumberOrString(item))
)

/**
 *
 * Add a value to an object found by given selector. You can also use unicode
 * characters like Left arrow or Back space. WebdriverIO will take care of
 * translating them into unicode characters. You’ll find all supported characters
 * [here](https://w3c.github.io/webdriver/webdriver-spec.html#keyboard-actions).
 * To do that, the value has to correspond to a key from the table. It can be disabled
 * by setting `translateToUnicode` optional parameter to false.
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
 * @param {string | number | Array<string | number>}        value                       value to be added
 * @param {CommandOptions=}                                 options                     command options (optional)
 * @param {boolean}                                         options.translateToUnicode  enable translation string to unicode value automatically
 *
 */
export default function addValue (
    this: WebdriverIO.Element,
    value: Value | Value[],
    { translateToUnicode = true }: CommandOptions = {}
) {
    if (!isValidType(value)) {
        log.warn('@deprecated: support for type "string", "number" or "Array<string | number>" is deprecated')
    }

    if (!this.isW3C) {
        return this.elementSendKeys(this.elementId, transformToCharString(value, translateToUnicode) as any as string)
    }

    return this.elementSendKeys(this.elementId, transformToCharString(value, translateToUnicode).join(''))
}
