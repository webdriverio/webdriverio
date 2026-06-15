/**
 * Bidi-preserving element command equivalents.
 *
 * Each function preserves the SPIRIT of the classic WebDriver check by
 * embedding it in the `browser.execute()` script body. The script runs
 * in the correct browsing context via ContextManager (AsyncLocalStorage).
 *
 * Gated behind `'wdio:experimentalBiDiCommands': true` capability.
 *
 * CRITICAL: function bodies passed to browser.execute() are stringified.
 * Do NOT use TypeScript type annotations in parameter lists — they
 * become invalid JavaScript in the browser.
 */
import { ELEMENT_KEY } from 'webdriver'
import { getBrowserObject } from '@wdio/utils'

/** Check if the experimental Bidi commands capability is enabled (cached on first access). */
export function isBidiCommandsEnabled(browser: WebdriverIO.Browser): boolean {
    return (browser as Record<string, unknown>).__bidiCommandsEnabled === true
}

/** Pass the raw element reference to browser.execute() so LocalValue.getArgument
 *  recognizes it as a Bidi node reference. */
function exec<T>(
    element: WebdriverIO.Element,
    fn: (...args: unknown[]) => T,
    ...args: unknown[]
): Promise<T> {
    const browser = getBrowserObject(element)
    // Wrap in raw ELEMENT_KEY reference for proper Bidi argument conversion
    const rawEl = { [ELEMENT_KEY]: element.elementId }
    return browser.execute(fn, rawEl, ...args) as Promise<T>
}

// ── Actions ──────────────────────────────────────────────

export function bidiClick(element: WebdriverIO.Element): Promise<void> {
    return exec(element, function (el) {
        if (el.disabled) { throw new Error('element not interactable: element is disabled') }
        el.scrollIntoView({ block: 'center', inline: 'center' })
        el.click()
    })
}

export function bidiClearValue(element: WebdriverIO.Element): Promise<void> {
    return exec(element, function (el) {
        el.focus()
        el.value = ''
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
    })
}

export function bidiAddValue(element: WebdriverIO.Element, value: string): Promise<void> {
    return exec(element, function (el, val) {
        el.focus()
        const v = el.value
        const s = el.selectionStart !== null ? el.selectionStart : v.length
        const e2 = el.selectionEnd !== null ? el.selectionEnd : v.length
        el.value = v.substring(0, s) + val + v.substring(e2)
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
    }, value)
}

// ── Reads ────────────────────────────────────────────────

export function bidiGetText(element: WebdriverIO.Element): Promise<string> {
    return exec(element, function (el) { return el.textContent || '' }) as Promise<string>
}

export function bidiGetValue(element: WebdriverIO.Element): Promise<string> {
    return exec(element, function (el) {
        return el.value || el.getAttribute('value') || ''
    }) as Promise<string>
}

export function bidiGetAttribute(element: WebdriverIO.Element, name: string): Promise<string | null> {
    return exec(element, function (el, n) { return el.getAttribute(n) }, name) as Promise<string | null>
}

export function bidiGetTagName(element: WebdriverIO.Element): Promise<string> {
    return exec(element, function (el) { return el.tagName.toLowerCase() }) as Promise<string>
}

export function bidiIsSelected(element: WebdriverIO.Element): Promise<boolean> {
    return exec(element, function (el) {
        return !!(el.selected || el.checked)
    }) as Promise<boolean>
}

export function bidiIsEnabled(element: WebdriverIO.Element): Promise<boolean> {
    return exec(element, function (el) { return !el.disabled }) as Promise<boolean>
}
