import { getBrowserObject } from '@wdio/utils'
import { BIDI_MASK, type remote } from 'webdriver'

import { Key } from '../constants.js'

/**
 * Helpers for elements that live in a held browsing context other than the
 * session's current one (a frame or a background tab). Classic WebDriver
 * element commands only see the current context's document, so these run
 * in the element's own document over WebDriver BiDi instead.
 */

/**
 * Type `text` into `element` with trusted key events in `context`.
 * `replace` selects the current content first, like `setValue`. Otherwise
 * the caret moves to the end, like `addValue`.
 */
export async function typeInContext (
    element: WebdriverIO.Element,
    context: string,
    text: string,
    options: { replace: boolean, mask?: boolean }
) {
    await element.execute((el: HTMLElement, replace: boolean) => {
        el.focus()
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            if (replace) {
                el.select()
                return
            }
            try {
                el.setSelectionRange(el.value.length, el.value.length)
            } catch {
                // e.g. `type="email"` or `type="number"` have no selection API
            }
            return
        }
        const selection = el.ownerDocument.getSelection()
        const range = el.ownerDocument.createRange()
        range.selectNodeContents(el)
        if (!replace) {
            range.collapse(false)
        }
        selection?.removeAllRanges()
        selection?.addRange(range)
    }, options.replace)

    /**
     * An empty `setValue` still has to clear the selected content.
     */
    const keys = text.length > 0 ? Array.from(text) : options.replace ? [Key.Backspace] : []
    if (keys.length === 0) {
        return
    }
    const browser = getBrowserObject(element)
    const params: remote.InputPerformActionsParameters = {
        context,
        actions: [{
            id: 'keyboard',
            type: 'key',
            actions: keys.flatMap((key) => [
                { type: 'keyDown' as const, value: key },
                { type: 'keyUp' as const, value: key }
            ])
        }]
    }
    if (options.mask) {
        Object.assign(params, { [BIDI_MASK]: true })
    }
    await browser.inputPerformActions(params)
    await browser.inputReleaseActions({ context })
}

export type OptionMatch =
    | { by: 'index', index: number }
    | { by: 'text', text: string }
    | { by: 'attribute', attribute: string, value: string }

/**
 * Select the first `<option>` of `select` that matches, the way clicking it
 * would: it sets (or, in a `multiple` select, toggles) the selection, then
 * fires `input`, and `change` when the selection changed. Retries until the
 * option exists, like the classic `selectBy*` commands.
 */
export async function selectOptionInContext (
    select: WebdriverIO.Element,
    match: OptionMatch,
    timeoutMsg: string
) {
    await select.waitUntil(() => select.execute((el: HTMLSelectElement, match: OptionMatch) => {
        const normalize = (value: string) => value.trim().replace(/\s+/g, ' ')
        const options = Array.from(el.querySelectorAll('option'))
        const option = match.by === 'index'
            ? options[match.index]
            : match.by === 'text'
                ? options.find((o) => o.textContent === match.text || normalize(o.textContent || '') === match.text)
                : options.find((o) => normalize(o.getAttribute(match.attribute) ?? '') === match.value)
        if (!option) {
            return false
        }
        if (el.disabled || option.disabled) {
            return true
        }
        const before = option.selected
        el.focus()
        option.selected = el.multiple ? !option.selected : true
        el.dispatchEvent(new Event('input', { bubbles: true }))
        if (option.selected !== before) {
            el.dispatchEvent(new Event('change', { bubbles: true }))
        }
        return true
    }, match), { timeoutMsg })
}
