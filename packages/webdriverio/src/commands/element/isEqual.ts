import { getBrowserObject } from '@wdio/utils'

/**
 *
 * Return true if the selected element matches with the provided one.
 *
 * <example>
    :isEqual.js
    it('should detect if an element is clickable', async () => {
        const el = await $('#el')
        const sameEl = await $('#el')
        const anotherEl = await $('#anotherEl')

        el.isEqual(sameEl) // outputs: true

        el.isEqual(anotherEl) // outputs: false
    });
 * </example>
 *
 * @alias element.isEqual
 * @param   {Element}   el element to compare with
 * @return  {Boolean}   true if elements are equal
 *
 */
export async function isEqual (
    this: WebdriverIO.Element,
    el: WebdriverIO.Element
) {
    const browser = getBrowserObject(this)

    // mobile native
    if (browser.isMobile) {
        /**
         * some Appium platforms don't support the `getContext` method, in that case
         * we can't determine if we are in a native context or not, so we return undefined
         */
        const context = await browser.getContext().catch(() => undefined)
        const contextId = typeof context === 'string'
            ? context
            : context?.id

        if (contextId && contextId.toLowerCase().includes('native')) {
            return this.elementId === el.elementId
        }
    }

    // browser or webview
    let result: boolean
    try {
        result = await browser.execute(
            /* istanbul ignore next */
            function (el1: HTMLElement, el2: HTMLElement) { return el1 === el2 },
            this as unknown as HTMLElement, el as unknown as HTMLElement)
    } catch {
        result = false
    }

    return result
}
