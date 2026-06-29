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

/** Check if the experimental Bidi commands capability is enabled.  Merges the
 *  `browser.isBidi` check so callers don't need to test both separately. */
export function isBidiCommandsEnabled(browser: WebdriverIO.Browser): boolean {
    return !!(browser.isBidi && (browser as unknown as Record<string, unknown>).__bidiCommandsEnabled === true)
}

/** Pass the raw element reference to browser.execute() so LocalValue.getArgument
 *  recognizes it as a Bidi node reference.  Caches the resolved browser on the
 *  element to avoid the O(d) parent-chain traversal on repeat calls. */
function exec<T>(
    element: WebdriverIO.Element,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fn: (...args: any[]) => T,
    ...args: unknown[]
): Promise<T> {
    const el = element as unknown as Record<string, unknown>
    const browser = (el.__bidiBrowser || getBrowserObject(element)) as WebdriverIO.Browser
    el.__bidiBrowser = browser
    // Wrap in raw ELEMENT_KEY reference for proper Bidi argument conversion
    const rawEl = { [ELEMENT_KEY]: element.elementId }
    return browser.execute(fn, rawEl, ...args) as Promise<T>
}

/**
 * Matches the Selenium atom: bot.action.clear()
 * @see https://github.com/SeleniumHQ/selenium/blob/trunk/javascript/atoms/action.js
 */
export function bidiClearValue(element: WebdriverIO.Element): Promise<void> {
    return exec(element, function (el) {
        // Mirrors bot.action.checkInteractable_ + bot.dom.isEditable
        if (el.disabled || el.readOnly) { throw new Error('element not interactable') }
        const tag = el.tagName.toLowerCase()
        const editable = tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
        if (!editable) { throw new Error('element not editable') }
        // Basic visibility check: not display:none, not visibility:hidden, has layout
        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden') {
            throw new Error('element not interactable')
        }

        el.scrollIntoView({ block: 'center', inline: 'center' })
        el.focus()
        // contentEditable uses textContent; form controls use value (matches atom)
        if (el.isContentEditable) {
            el.textContent = ''
        } else {
            el.value = ''
        }
        // Atom fires only 'change', not 'input'
        el.dispatchEvent(new Event('change', { bubbles: true }))
    })
}

/**
 * Matches the Selenium atom: bot.action.type(), dispatched via
 * webdriver.atoms.inputs.sendKeys → webdriver.atoms.element.type.
 * @see https://github.com/SeleniumHQ/selenium/blob/trunk/javascript/atoms/action.js
 *
 * NOTE: The atom dispatches per-character keydown→keypress→keyup events.
 * We cannot do that from browser.execute() — JS cannot create trusted
 * KeyboardEvent instances. Use the Actions API (browser.keys()) if your
 * app relies on individual key events.
 */
export function bidiAddValue(element: WebdriverIO.Element, value: string): Promise<void> {
    return exec(element, function (el, val) {
        // Mirrors bot.action.checkInteractable_ + bot.dom.isEditable
        if (el.disabled || el.readOnly) { throw new Error('element not interactable') }
        const tag = el.tagName.toLowerCase()
        const editable = tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
        if (!editable) { throw new Error('element not editable') }
        const style = window.getComputedStyle(el)
        if (style.display === 'none' || style.visibility === 'hidden') {
            throw new Error('element not interactable')
        }

        // Atom only scrolls+focuses if element is not already the active element
        if (document.activeElement !== el) {
            el.scrollIntoView({ block: 'center', inline: 'center' })
            el.focus()
        }

        const v = el.value
        const vLen = typeof v === 'string' ? v.length : 0
        // Only use selectionStart/End when they are actual numbers.  Both null
        // (form element, no active selection) and undefined (contentEditable
        // div, property absent) fall back to vLen.  The original !== null check
        // treated undefined as a real value, causing doubled content.
        const s = typeof el.selectionStart === 'number' ? el.selectionStart : vLen
        const e2 = typeof el.selectionEnd === 'number' ? el.selectionEnd : vLen
        // contentEditable: splice into textContent; form controls: splice into value
        if (el.isContentEditable) {
            el.textContent = (el.textContent || '').substring(0, s) + val + (el.textContent || '').substring(e2)
        } else {
            el.value = v.substring(0, s) + val + v.substring(e2)
        }
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
    }, value)
}

// ── Reads ────────────────────────────────────────────────

export function bidiGetText(element: WebdriverIO.Element): Promise<string> {
    return exec(element, function (el) { return el.innerText || '' }) as Promise<string>
}

export function bidiGetValue(element: WebdriverIO.Element): Promise<string> {
    return exec(element, function (el) {
        const v = el.value
        return typeof v === 'string' ? v : (el.getAttribute('value') || '')
    }) as Promise<string>
}

/**
 * Matches the Selenium atom: webdriver.atoms.element.attribute.get()
 * @see https://github.com/SeleniumHQ/selenium/blob/trunk/javascript/webdriver/atoms/attribute.js
 */
export function bidiGetAttribute(element: WebdriverIO.Element, name: string): Promise<string | null> {
    return exec(element, function (el, attrName) {
        const BOOLEAN_PROPS = new Set([
            'allowfullscreen', 'allowpaymentrequest', 'allowusermedia', 'async',
            'autofocus', 'autoplay', 'checked', 'compact', 'complete', 'controls',
            'declare', 'default', 'defaultchecked', 'defaultselected', 'defer',
            'disabled', 'ended', 'formnovalidate', 'hidden', 'indeterminate',
            'iscontenteditable', 'ismap', 'itemscope', 'loop', 'multiple', 'muted',
            'nohref', 'nomodule', 'noresize', 'noshade', 'novalidate', 'nowrap',
            'open', 'paused', 'playsinline', 'pubdate', 'readonly', 'required',
            'reversed', 'scoped', 'seamless', 'seeking', 'selected', 'truespeed',
            'typemustmatch', 'willvalidate'
        ])
        const PROP_ALIASES = { 'class': 'className', 'readonly': 'readOnly' }

        const n = attrName.toLowerCase()

        // 1. style → computed cssText
        if (n === 'style') {
            const style = el.style
            if (!style) { return null }
            return typeof style === 'string' ? style : style.cssText
        }

        // 2. selected/checked on selectable elements → boolean normalization
        if (n === 'selected' || n === 'checked') {
            const isOpt = el.tagName === 'OPTION'
            const isCheckable = el.tagName === 'INPUT' && ((el.type || '').toLowerCase() === 'checkbox' || (el.type || '').toLowerCase() === 'radio')
            if (isOpt || isCheckable) {
                return (isOpt ? el.selected : el.checked) ? 'true' : null
            }
        }

        // 3. href on <a> / src on <img> → resolved URL (property, not literal attribute)
        const tag = el.tagName.toUpperCase()
        if ((tag === 'IMG' && n === 'src') || (tag === 'A' && n === 'href')) {
            const raw = el.getAttribute(n)
            if (raw) { return String(el[n]) }
            return raw
        }

        // 4. spellcheck → normalized 'true'/'false'
        if (n === 'spellcheck') {
            const sa = el.getAttribute(n)
            if (sa !== null) {
                const lower = sa.toLowerCase()
                if (lower === 'false') { return 'false' }
                if (lower === 'true') { return 'true' }
            }
            return String(el.spellcheck)
        }

        // 5. Boolean properties → 'true' or null
        const propName = (PROP_ALIASES as Record<string, string>)[n] || n
        if (BOOLEAN_PROPS.has(n)) {
            const hasAttr = el.getAttribute(n) !== null
            const propVal = el[propName]
            return (hasAttr || !!propVal) ? 'true' : null
        }

        // 6. value on <li> → raw attribute (avoid numeric li.value index)
        if (n === 'value' && tag === 'LI') {
            const v = el.getAttribute(n)
            return v !== null ? v : null
        }

        // 7. General case: DOM property first, attribute fallback
        let prop
        try { prop = el[propName] } catch { /* property access may throw on some nodes */ }
        if (prop === null || prop === undefined || (typeof prop === 'object' && prop !== null)) {
            const attr = el.getAttribute(n)
            return attr !== null ? attr : null
        }
        return prop !== null && prop !== undefined ? String(prop) : null
    }, name) as Promise<string | null>
}

export function bidiGetTagName(element: WebdriverIO.Element): Promise<string> {
    return exec(element, function (el) { return el.tagName.toLowerCase() }) as Promise<string>
}

export function bidiGetProperty(element: WebdriverIO.Element, property: string): Promise<unknown> {
    return exec(element, function (el, prop) { return el[prop] }, property)
}

/**
 * Returns the raw computed CSS value.  The caller (`parseCSS`) handles
 * color conversion, unit parsing, and shorthand expansion — same as
 * the classic protocol path.
 */
export function bidiGetCSSProperty(element: WebdriverIO.Element, cssProperty: string): Promise<string> {
    return exec(element, function (el, prop) {
        return window.getComputedStyle(el)[prop]
    }, cssProperty) as Promise<string>
}

// ── Select ─────────────────────────────────────────────────

/**
 * Select an <option> by its visible text.  Uses browser.execute() to
 * set option.selected directly — options inside a <select> dropdown
 * are never visible, so clicking them via the Actions API would fail
 * with "element not interactable".
 */
export function bidiSelectByVisibleText(element: WebdriverIO.Element, text: string): Promise<void> {
    return exec(element, function (selectEl, targetText) {
        const options = selectEl.options
        for (let i = 0; i < options.length; i++) {
            const opt = options[i]
            const displayText = (opt.textContent || '').trim().replace(/\s+/g, ' ')
            if (displayText === targetText) {
                opt.selected = true
                selectEl.dispatchEvent(new Event('change', { bubbles: true }))
                return
            }
        }
    }, text)
}

/**
 * Select an <option> by attribute value.  Checks both the HTML
 * attribute (getAttribute) and the DOM property — they can diverge
 * (e.g. option.value vs option.getAttribute('value')).
 */
export function bidiSelectByAttribute(element: WebdriverIO.Element, attribute: string, value: string): Promise<void> {
    return exec(element, function (selectEl, attr, val) {
        const options = selectEl.options
        for (let i = 0; i < options.length; i++) {
            const opt = options[i]
            if (opt.getAttribute(attr) === val || opt[attr] === val) {
                opt.selected = true
                selectEl.dispatchEvent(new Event('change', { bubbles: true }))
                return
            }
        }
    }, attribute, value)
}

/**
 * Select an <option> by index.
 */
export function bidiSelectByIndex(element: WebdriverIO.Element, index: number): Promise<void> {
    return exec(element, function (selectEl, idx) {
        const option = selectEl.options[idx]
        if (option) {
            option.selected = true
            selectEl.dispatchEvent(new Event('change', { bubbles: true }))
        }
    }, index)
}

export function bidiIsSelected(element: WebdriverIO.Element): Promise<boolean> {
    return exec(element, function (el) {
        return !!(el.selected || el.checked)
    }) as Promise<boolean>
}

export function bidiIsEnabled(element: WebdriverIO.Element): Promise<boolean> {
    return exec(element, function (el) {
        if (el.disabled) { return false }
        const fs = el.closest('fieldset[disabled]')
        if (fs) {
            const legend = fs.querySelector(':scope > legend:first-of-type')
            if (!legend || !legend.contains(el)) { return false }
        }
        return true
    }) as Promise<boolean>
}
