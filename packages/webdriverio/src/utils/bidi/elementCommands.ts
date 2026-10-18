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
import { nameStaleElement, withKnownElement } from '../foreignContext.js'
import { GET_VISIBLE_TEXT } from '../thirdParty/getVisibleText.js'

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
    return (target.execute(withKnownElement(fn), rawEl, ...args) as Promise<T>)
        .catch(nameNotInteractable)
        .catch(nameStaleElement)
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
        const wasActive = document.activeElement === el
        if (!wasActive) {
            el.scrollIntoView({ block: 'center', inline: 'center' })
            el.focus()
        }

        const v = el.value
        const vLen = typeof v === 'string' ? v.length : (el.textContent || '').length
        // Only use selectionStart/End when they are actual numbers.  Both null
        // (form element, no active selection) and undefined (contentEditable
        // div, property absent) fall back to vLen.  The original !== null check
        // treated undefined as a real value, causing doubled content.
        // A freshly focused element has its caret at the start; send-keys types at the end
        const s = wasActive && typeof el.selectionStart === 'number' ? el.selectionStart : vLen
        const e2 = wasActive && typeof el.selectionEnd === 'number' ? el.selectionEnd : vLen
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
    // innerText returns the full text of non-rendered elements; Classic Get Element Text returns ''
    const fn = new Function('el', `return (${GET_VISIBLE_TEXT}).call(null, el)`) as (...args: unknown[]) => string
    return exec(element, fn) as Promise<string>
}

export function bidiGetValue(element: WebdriverIO.Element): Promise<string> {
    return exec(element, function (el) {
        const v = el.value
        return typeof v === 'string' ? v : (el.getAttribute('value') || '')
    }) as Promise<string>
}

/**
 * W3C Get Element Attribute: boolean attributes → 'true' if present, else the raw attribute value.
 * @see https://w3c.github.io/webdriver/#get-element-attribute
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
        if (BOOLEAN_PROPS.has(attrName.toLowerCase())) {
            return el.hasAttribute(attrName) ? 'true' : null
        }
        return el.getAttribute(attrName)
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

export type BidiDisabledSource = 'option' | 'optgroup' | 'select'

export interface BidiSelectResult {
    selected: boolean
    count: number
    disabled?: BidiDisabledSource
}

type SelectMatch = 'text' | 'attribute' | 'index'

/**
 * Select an <option> by setting option.selected directly — options inside a
 * <select> dropdown are never visible, so clicking them via the Actions API
 * would fail with "element not interactable". A disabled select, optgroup or
 * option is reported instead of selected, as a user could not pick it either.
 * The matcher lives in the page, so all three select commands share this one
 * function.
 */
function selectInPage(element: WebdriverIO.Element, match: SelectMatch, first: string | number, second?: string): Promise<BidiSelectResult> {
    return exec(element, function (selectEl, kind, a, b) {
        const normalize = (value: string) => (value || '').replace(/\s+/g, ' ').trim()
        const normalizeSpace = (value: string | null) => (value ?? '').replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, '').replace(/[ \t\r\n]+/g, ' ')
        const options = selectEl.options
        const count = options.length
        let option = null
        if (kind === 'index') {
            option = options[a] || null
        } else {
            for (let i = 0; i < count && !option; i++) {
                const opt = options[i]
                const matches = kind === 'text'
                    ? normalize(opt.textContent) === a || normalize(opt.label) === a
                    : normalizeSpace(opt.getAttribute(a.trim())) === b.trim()
                if (matches) { option = opt }
            }
        }
        if (!option) { return { selected: false, count } }
        let disabled = null
        if (selectEl.disabled) {
            disabled = 'select'
        } else if (option.disabled) {
            disabled = 'option'
        } else if (option.closest('optgroup[disabled]')) {
            disabled = 'optgroup'
        }
        if (disabled) { return { selected: false, count, disabled } }
        option.selected = true
        selectEl.dispatchEvent(new Event('change', { bubbles: true }))
        return { selected: true, count }
    }, match, first, second) as Promise<BidiSelectResult>
}

export function bidiSelectByVisibleText(element: WebdriverIO.Element, text: string): Promise<BidiSelectResult> {
    return selectInPage(element, 'text', text)
}

/**
 * Checks both the HTML attribute (getAttribute) and the DOM property — they
 * can diverge (e.g. option.value vs option.getAttribute('value')).
 */
export function bidiSelectByAttribute(element: WebdriverIO.Element, attribute: string, value: string): Promise<BidiSelectResult> {
    return selectInPage(element, 'attribute', attribute, value)
}

export function bidiSelectByIndex(element: WebdriverIO.Element, index: number): Promise<BidiSelectResult> {
    return selectInPage(element, 'index', index)
}

const DISABLED_SOURCE_LABEL: Record<BidiDisabledSource, string> = {
    option: 'The option itself is disabled.',
    optgroup: 'The option sits in a disabled <optgroup>.',
    select: 'The <select> element is disabled.'
}

/**
 * Builds the error for a select command that hit a disabled element, so
 * the test does not pass on an action a user cannot perform.
 */
export function bidiDisabledSelectError(command: string, option: string, source: BidiDisabledSource): Error {
    return new Error(
        `${command} cannot select ${option}: ${DISABLED_SOURCE_LABEL[source]} ` +
        'A user cannot select a disabled option, so this action is impossible and the test would pass on something that cannot happen. ' +
        'This error comes from the BiDi select implementation enabled by the "wdio:experimentalBiDiCommands" capability. ' +
        'To fix it, enable the element in the page before selecting, or select a different option.'
    )
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
