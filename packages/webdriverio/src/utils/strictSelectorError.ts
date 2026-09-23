import type { Selector } from '../types.js'

/**
 * render a selector in a form that can be pasted back into a test
 */
function selectorToString (selector: Selector) {
    if (typeof selector === 'function') {
        return selector.toString()
    }
    return JSON.stringify(selector)
}

/**
 * Error thrown when `$` is used in strict mode (the default as of v10) and the
 * given selector resolves to more than one element.
 *
 * This lives in its own leaf module (no runtime imports beyond the `Selector`
 * type) so that other leaf utilities - notably `implicitWait.ts` - can check
 * `instanceof StrictSelectorError` without pulling in `strictMode.ts`'s
 * `findStrictElement`, which imports the whole `utils/index.ts` barrel and,
 * transitively through the command barrels and `middlewares.ts`, closes a
 * circular import back onto `refetchElement.ts`/`implicitWait.ts` themselves.
 *
 * @see https://github.com/webdriverio/webdriverio/issues/15666
 */
export class StrictSelectorError extends Error {
    /**
     * amount of elements the selector resolved to
     */
    matches: number
    /**
     * selector that was used to query the elements
     */
    selector: Selector

    constructor (selector: Selector, matches: number) {
        const printable = selectorToString(selector)
        super(
            `strict mode violation: \`$(${printable})\` resolved to ${matches} elements, expected 1.\n` +
            `Use \`$$(${printable})\` to work with all matches, \`$$(${printable})[0]\` if you explicitly ` +
            'want the first one, or narrow down the selector so it matches a single element.\n' +
            `Opt out for a single call with \`$(${printable}, { strict: false })\` or globally by setting ` +
            '`strictSelectors: false` in your WebdriverIO config.'
        )
        this.name = 'StrictSelectorError'
        this.matches = matches
        this.selector = selector
    }
}
