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
import { BIDI_MASK, ELEMENT_KEY, type remote } from 'webdriver'
import { getBrowserObject } from '@wdio/utils'

import { contextIdValue, heldBrowsingContext } from '../../session/browsingContext.js'
import { getContextManager, getParallelContextStore } from '../../session/context.js'

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
    const target = (el.__bidiBrowser || heldBrowsingContext(element) || getBrowserObject(element)) as WebdriverIO.Browser
    el.__bidiBrowser = target
    // Wrap in raw ELEMENT_KEY reference for proper Bidi argument conversion
    const rawEl = { [ELEMENT_KEY]: element.elementId }
    return (target.execute(fn, rawEl, ...args) as Promise<T>).catch(nameNotInteractable)
}

const NOT_INTERACTABLE = 'element not interactable'

/**
 * An error thrown inside the page reaches Node with a generic name, so the
 * middleware's `waitForClickable` retry would never see it. Match on the message.
 */
function nameNotInteractable(err: unknown): never {
    if (err instanceof Error && err.message.includes(NOT_INTERACTABLE)) {
        err.name = NOT_INTERACTABLE
    }
    throw err
}

/** Matches any WebDriver special key (Key.Enter, Key.Tab, ...), which splicing into `value` would type as literal characters. */
const SPECIAL_KEY = /[\uE000-\uE05D]/

/**
 * Inspired by the Selenium atom: bot.action.clear()
 * @see https://github.com/SeleniumHQ/selenium/blob/trunk/javascript/atoms/action.js
 */
export function bidiClearValue(element: WebdriverIO.Element): Promise<void> {
    return exec(element, withEditableGuard(function (el) {
        el.scrollIntoView({ block: 'center', inline: 'center' })
        el.focus()
        // contentEditable uses textContent; form controls use value (matches atom)
        if (el.isContentEditable) {
            el.textContent = ''
        } else {
            setNativeValue(el, '')
        }
        // The atom fires only 'change'; frameworks that listen for 'input' (React) need both
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
    }))
}

/**
 * Function bodies sent to the page are stringified and cannot close over module
 * scope, so the shared guard is inlined into the composed function's source.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const assertEditableTarget = function (el: any) {
    // Mirrors bot.action.checkInteractable_ + bot.dom.isEditable
    if (el.disabled || el.readOnly) { throw new Error('element not interactable') }
    const tag = el.tagName.toLowerCase()
    const editable = tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
    if (!editable) { throw new Error('element not editable') }
    const style = window.getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden') {
        throw new Error('element not interactable')
    }
}

/**
 * Writes through the prototype's setter: React's value tracker shadows the
 * instance property, so a plain `el.value = x` never triggers its onChange.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setNativeValue = function (el: any, newValue: string) {
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')
    if (descriptor && descriptor.set) {
        descriptor.set.call(el, newValue)
    } else {
        el.value = newValue
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withEditableGuard(body: (el: any, ...args: any[]) => unknown) {
    return new Function(
        'el',
        'value',
        `const setNativeValue = ${setNativeValue}; (${assertEditableTarget})(el); return (${body})(el, value)`
    ) as (...args: unknown[]) => void
}

/**
 * Inspired by the Selenium atom: bot.action.type(), dispatched via
 * webdriver.atoms.inputs.sendKeys → webdriver.atoms.element.type.
 * @see https://github.com/SeleniumHQ/selenium/blob/trunk/javascript/atoms/action.js
 *
 * NOTE: The atom dispatches per-character keydown→keypress→keyup events.
 * We cannot do that from browser.execute() — JS cannot create trusted
 * KeyboardEvent instances. Use the Actions API (browser.keys()) if your
 * app relies on individual key events.
 */
export function bidiAddValue(element: WebdriverIO.Element, value: string): Promise<void> {
    if (SPECIAL_KEY.test(value)) {
        return typeKeys(element, value, false)
    }
    return exec(element, withEditableGuard(function (el, val) {
        // Atom only scrolls+focuses if element is not already the active element
        if (document.activeElement !== el) {
            el.scrollIntoView({ block: 'center', inline: 'center' })
            el.focus()
        }

        const v = el.value
        const vLen = typeof v === 'string' ? v.length : (el.textContent || '').length
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
            setNativeValue(el, v.substring(0, s) + val + v.substring(e2))
        }
        el.dispatchEvent(new Event('input', { bubbles: true }))
        el.dispatchEvent(new Event('change', { bubbles: true }))
    }), value)
}

/**
 * Types `value` through BiDi key actions so the text can be redacted from logs
 * and `bidiCommand` events via `BIDI_MASK`. `typeKeys` also serves unmasked
 * values holding special keys. Unlike `elementSendKeys`, this
 * reaches the element's own tab in parallel mode and held browsing contexts.
 */
export function bidiAddMaskedValue(element: WebdriverIO.Element, value: string): Promise<void> {
    return typeKeys(element, value, true)
}

async function typeKeys(element: WebdriverIO.Element, value: string, mask: boolean): Promise<void> {
    await exec(element, withEditableGuard(function (el) {
        if (el.ownerDocument.activeElement !== el) {
            el.scrollIntoView({ block: 'center', inline: 'center' })
            el.focus()
            if (el.isContentEditable) {
                el.ownerDocument.getSelection().setPosition(el, el.childNodes.length)
            } else if (typeof el.value === 'string') {
                try { el.setSelectionRange(el.value.length, el.value.length) } catch { /* e.g. type=email has no selection API */ }
            }
        }
        const root = el.getRootNode()
        const active = (root && root.activeElement) || el.ownerDocument.activeElement
        if (!active || (active !== el && !el.contains(active) && !(el.shadowRoot && el.shadowRoot.contains(active)))) {
            throw new Error('element not interactable: element could not receive focus')
        }
    }))
    if (!value) { return }

    const held = heldBrowsingContext(element)
    const browser = held ? held.browser : getBrowserObject(element)
    const context = held?.contextId
        ?? getParallelContextStore().getStore()
        ?? contextIdValue(await getContextManager(browser).getCurrentContext())
    const params: remote.InputPerformActionsParameters = {
        context,
        actions: [{
            id: 'keyboard',
            type: 'key',
            actions: Array.from(value).flatMap((key) => [
                { type: 'keyDown' as const, value: key },
                { type: 'keyUp' as const, value: key }
            ])
        }]
    }
    await browser.inputPerformActions(mask ? Object.assign(params, { [BIDI_MASK]: true }) : params)
    await browser.inputReleaseActions({ context })
}

interface ClickableCheck {
    ok: boolean
    x: number
    y: number
    target: string
    hit: string
    notInteractable?: string
}

/**
 * Restores chromedriver's "element click intercepted" check for Actions-based
 * clicks: scrolls the element to the center if needed, then verifies the
 * element (or a descendant) is what sits at its center point.
 */
export async function bidiAssertClickable(element: WebdriverIO.Element): Promise<void> {
    const result = await exec(element, function (el): ClickableCheck {
        const describe = (node: Element) => {
            let out = '<' + node.tagName.toLowerCase()
            if (node.id) { out += ' id="' + node.id + '"' }
            const cls = node.getAttribute('class')
            if (cls) { out += ' class="' + cls + '"' }
            return out + '>'
        }
        const rect = el.getClientRects()[0]
        if (!rect) {
            return { ok: false, x: 0, y: 0, target: describe(el), hit: 'null', notInteractable: 'element is not displayed' }
        }
        if (!rect.width || !rect.height) {
            return { ok: false, x: 0, y: 0, target: describe(el), hit: 'null', notInteractable: 'element has zero size' }
        }
        const center = () => {
            const r = el.getClientRects()[0] || el.getBoundingClientRect()
            return { x: Math.floor(r.left + r.width / 2), y: Math.floor(r.top + r.height / 2) }
        }
        let p = center()
        if (p.x < 0 || p.y < 0 || p.x >= window.innerWidth || p.y >= window.innerHeight) {
            el.scrollIntoView({ block: 'center', inline: 'center' })
            p = center()
        }
        const root = el.getRootNode()
        const hit = (root && typeof root.elementFromPoint === 'function' ? root : document).elementFromPoint(p.x, p.y)
        const ok = !!hit && (hit === el || el.contains(hit) || (!!el.shadowRoot && el.shadowRoot.contains(hit)))
        return { ok, x: p.x, y: p.y, target: describe(el), hit: hit ? describe(hit) : 'null' }
    })
    if (result.notInteractable) {
        const error = new Error(`element not interactable: ${result.notInteractable}`)
        error.name = 'element not interactable'
        throw error
    }
    if (!result.ok) {
        const error = new Error(
            `element click intercepted: Element ${result.target} is not clickable at point (${result.x}, ${result.y}). ` +
            `Other element would receive the click: ${result.hit}`
        )
        error.name = 'element click intercepted'
        throw error
    }
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
 * Inspired by the Selenium atom: webdriver.atoms.element.attribute.get()
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
        if (prop === null || prop === undefined || (typeof prop === 'object' && prop !== null) || typeof prop === 'function') {
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

export function bidiGetRect(element: WebdriverIO.Element): Promise<{ x: number, y: number, width: number, height: number }> {
    return exec(element, function (el) {
        const rect = el.getBoundingClientRect()
        const view = el.ownerDocument.defaultView
        return {
            x: rect.x + (view ? view.scrollX : 0),
            y: rect.y + (view ? view.scrollY : 0),
            width: rect.width,
            height: rect.height
        }
    })
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
export function bidiSelectByVisibleText(element: WebdriverIO.Element, text: string): Promise<boolean> {
    return exec(element, function (selectEl, targetText) {
        const normalize = (value: string) => (value || '').replace(/\s+/g, ' ').trim()
        const options = selectEl.options
        for (let i = 0; i < options.length; i++) {
            const opt = options[i]
            if (normalize(opt.textContent) === targetText || normalize(opt.label) === targetText) {
                opt.selected = true
                selectEl.dispatchEvent(new Event('change', { bubbles: true }))
                return true
            }
        }
        return false
    }, text) as Promise<boolean>
}

/**
 * Select an <option> by attribute value.  Checks both the HTML
 * attribute (getAttribute) and the DOM property — they can diverge
 * (e.g. option.value vs option.getAttribute('value')).
 */
export function bidiSelectByAttribute(element: WebdriverIO.Element, attribute: string, value: string): Promise<boolean> {
    return exec(element, function (selectEl, attr, val) {
        const options = selectEl.options
        for (let i = 0; i < options.length; i++) {
            const opt = options[i]
            if (opt.getAttribute(attr) === val || opt[attr] === val) {
                opt.selected = true
                selectEl.dispatchEvent(new Event('change', { bubbles: true }))
                return true
            }
        }
        return false
    }, attribute, value) as Promise<boolean>
}

/**
 * Select an <option> by index. Resolves with whether it was selected and how
 * many options the select holds.
 */
export function bidiSelectByIndex(element: WebdriverIO.Element, index: number): Promise<{ selected: boolean, count: number }> {
    return exec(element, function (selectEl, idx) {
        const count = selectEl.options.length
        const option = selectEl.options[idx]
        if (!option) {
            return { selected: false, count }
        }
        option.selected = true
        selectEl.dispatchEvent(new Event('change', { bubbles: true }))
        return { selected: true, count }
    }, index) as Promise<{ selected: boolean, count: number }>
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
