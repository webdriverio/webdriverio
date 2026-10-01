import { foreignContextId } from '../../session/browsingContext.js'

/**
 *
 * Clear the value of an input or textarea element. Make sure you can interact with the
 * element before using this command. You can't clear an input element that is disabled or in
 * readonly mode.
 *
 * <example>
    :clearValue.js
    it('should demonstrate the clearValue command', async () => {
        const elem = await $('.input')
        await elem.setValue('test123')

        const value = await elem.getValue()
        console.log(value) // returns 'test123'

        await elem.clearValue()
        value = await elem.getValue()
        assert(value === ''); // true
    })
 * </example>
 *
 * @alias element.clearValue
 * @uses protocol/elements, protocol/elementIdClear
 * @type action
 *
 */
export async function clearValue (this: WebdriverIO.Element) {
    if (await foreignContextId(this)) {
        /**
         * Element Clear in the element's own document: focus, empty the value
         * (through the native setter so framework value tracking sees it),
         * fire `input` and `change`, then blur.
         */
        await this.execute((el: HTMLElement) => {
            el.focus()
            if (el.isContentEditable) {
                el.innerHTML = ''
                el.dispatchEvent(new Event('input', { bubbles: true }))
            } else {
                const field = el as HTMLInputElement
                const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(field), 'value')?.set
                if (setter) {
                    setter.call(field, '')
                } else {
                    field.value = ''
                }
                field.dispatchEvent(new Event('input', { bubbles: true }))
                field.dispatchEvent(new Event('change', { bubbles: true }))
            }
            el.blur()
        })
        return
    }
    return this.elementClear(this.elementId)
}
