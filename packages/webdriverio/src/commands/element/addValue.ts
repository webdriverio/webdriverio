import { transformToCharString } from '../../utils'

export type AddValueOptions = {
    translateToUnicode?: boolean
}

type Value = string | number

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
    it('should demonstrate the addValue command', () => {
        let input = $('.input')
        input.addValue('test')
        input.addValue(123)

        value = input.getValue()
        assert(value === 'test123') // true
    })
 * </example>
 *
 * @alias element.addValue
 * @param {string | number | Array<string> | Array<number>} value                       value to be added
 * @param {AddValueOptions=}                                options                     command options (optional)
 * @param {boolean}                                         options.translateToUnicode  enable translation string to unicode value automatically
 *
 */
export default function addValue (
    this: WebdriverIO.Element,
    value: Value | Value[],
    { translateToUnicode = true }: AddValueOptions = {}
) {
    if (!this.isW3C) {
        return this.elementSendKeys(this.elementId, transformToCharString(value as string[], translateToUnicode) as any as string)
    }

    return this.elementSendKeys(this.elementId, transformToCharString(value, translateToUnicode).join(''))
}
