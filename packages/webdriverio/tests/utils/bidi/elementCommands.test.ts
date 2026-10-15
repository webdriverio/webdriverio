import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { ELEMENT_KEY } from 'webdriver'
import { Key } from '../../../src/constants.js'
import { GET_VISIBLE_TEXT } from '../../../src/utils/thirdParty/getVisibleText.js'

vi.mock('fetch')
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

// Hoisted mock for @wdio/utils
vi.mock('@wdio/utils', async (importOriginal) => {
    const actual = await importOriginal<{ getBrowserObject: Function }>()
    return { ...actual, getBrowserObject: vi.fn() }
})

const {
    isBidiCommandsEnabled,
    bidiClearValue,
    bidiAddValue,
    bidiAddMaskedValue,
    bidiGetText,
    bidiGetValue,
    bidiGetAttribute,
    bidiGetTagName,
    bidiGetProperty,
    bidiGetCSSProperty,
    bidiSelectByVisibleText,
    bidiSelectByAttribute,
    bidiSelectByIndex,
    bidiIsSelected,
    bidiIsEnabled,
    bidiAssertClickable,
} = await import('../../../src/utils/bidi/elementCommands.js')

/**
 * Creates a mock element, calls `bidiFn(element, ...args)`, and returns
 * the captured function body that was passed to `browser.execute()`.
 */
async function captureExecutedFn(
    bidiFn: (el: any, ...args: any[]) => Promise<any>,
    args: unknown[] = [],
    executeResult = 'mock-result'
): Promise<{ fn: Function; mockExecute: ReturnType<typeof vi.fn> }> {
    const mockExecute = vi.fn().mockResolvedValue(executeResult)
    const { getBrowserObject } = await import('@wdio/utils')
    vi.mocked(getBrowserObject).mockReturnValue({ execute: mockExecute } as any)

    const element = { elementId: 'elem-test' }
    await bidiFn(element as any, ...args)

    const fn = mockExecute.mock.calls[0]?.[0] as Function | undefined
    if (!fn) { throw new Error('Expected mockExecute to have been called') }

    return { fn, mockExecute }
}

/** An input whose `value` is an accessor on the prototype, with a shadowing instance property like React's value tracker. */
function makeReactLikeInput(initial: string) {
    const protoSet = vi.fn()
    const instanceSet = vi.fn()
    const proto = { get value() { return initial }, set value(v: string) { protoSet(v) } }
    const el: any = Object.create(proto)
    Object.defineProperty(el, 'value', { get: () => initial, set: instanceSet, configurable: true })
    Object.assign(el, {
        tagName: 'INPUT', disabled: false, readOnly: false, isContentEditable: false,
        selectionStart: null, selectionEnd: null,
        scrollIntoView: vi.fn(), focus: vi.fn(), dispatchEvent: vi.fn(), style: {}
    })
    return { el, protoSet, instanceSet }
}

async function withPageGlobals<T>(el: unknown, run: () => T): Promise<T> {
    const g = globalThis as any
    const origWindow = g.window
    const origDoc = g.document
    g.window = { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
    g.document = { activeElement: el }
    try { return run() } finally { g.window = origWindow; g.document = origDoc }
}

describe('isBidiCommandsEnabled', () => {
    it('returns false when browser.isBidi is falsy', () => {
        expect(isBidiCommandsEnabled({ isBidi: false } as any)).toBe(false)
        expect(isBidiCommandsEnabled({ isBidi: undefined } as any)).toBe(false)
    })

    it('returns false when __bidiCommandsEnabled is not true', () => {
        expect(isBidiCommandsEnabled({ isBidi: true } as any)).toBe(false)
        expect(isBidiCommandsEnabled({ isBidi: true, __bidiCommandsEnabled: false } as any)).toBe(false)
    })

    it('returns true when both flags are set', () => {
        expect(isBidiCommandsEnabled({ isBidi: true, __bidiCommandsEnabled: true } as any)).toBe(true)
    })
})

describe('bidiGetText', () => {
    it('calls browser.execute with the element ref', async () => {
        const { mockExecute } = await captureExecutedFn(bidiGetText, [], 'Hello World')
        expect(mockExecute.mock.calls[0][1]).toEqual({ [ELEMENT_KEY]: 'elem-test' })
    })

    it('runs the visible-text atom so non-rendered elements yield an empty string', async () => {
        const { fn } = await captureExecutedFn(bidiGetText)
        expect(fn.toString()).toContain(GET_VISIBLE_TEXT)
        expect(fn.toString()).not.toContain('innerText')
    })
})

describe('bidiGetTagName', () => {
    it('lowercases the tagName', async () => {
        const { fn } = await captureExecutedFn(bidiGetTagName, [], 'div')
        expect(fn({ tagName: 'DIV' })).toBe('div')
        expect(fn({ tagName: 'SPAN' })).toBe('span')
    })
})

describe('bidiGetValue', () => {
    it('returns el.value when it is a string', async () => {
        const { fn } = await captureExecutedFn(bidiGetValue)
        expect(fn({ value: 'direct' })).toBe('direct')
    })

    it('falls back to getAttribute("value") when el.value is not a string', async () => {
        const { fn } = await captureExecutedFn(bidiGetValue)
        const el = { value: undefined, getAttribute: (name: string) => name === 'value' ? 'fallback' : null }
        expect(fn(el)).toBe('fallback')
    })

    it('returns empty string when both are missing', async () => {
        const { fn } = await captureExecutedFn(bidiGetValue)
        expect(fn({ value: null, getAttribute: () => null })).toBe('')
    })
})

describe('bidiGetProperty', () => {
    it('reads a DOM property by name', async () => {
        const { fn } = await captureExecutedFn(bidiGetProperty, ['className'])
        const el = { className: 'foo', id: 'bar' }
        expect(fn(el, 'className')).toBe('foo')
        expect(fn(el, 'id')).toBe('bar')
    })

    it('returns undefined for missing properties', async () => {
        const { fn } = await captureExecutedFn(bidiGetProperty, ['nope'])
        expect(fn({}, 'nope')).toBeUndefined()
    })
})

describe('bidiGetCSSProperty', () => {
    it('reads computed CSS property via window.getComputedStyle', async () => {
        const { fn } = await captureExecutedFn(bidiGetCSSProperty, ['font-size'], '16px')
        const fakeStyle = { fontSize: '16px', color: 'rgb(0,0,0)' }
        const origWindow = (globalThis as any).window
        try {
            (globalThis as any).window = { getComputedStyle: () => fakeStyle }
            expect(fn({}, 'fontSize')).toBe('16px')
            expect(fn({}, 'color')).toBe('rgb(0,0,0)')
        } finally {
            (globalThis as any).window = origWindow
        }
    })
})

describe('bidiIsSelected', () => {
    it('returns true when element is selected or checked', async () => {
        const { fn } = await captureExecutedFn(bidiIsSelected, [], true)
        expect(fn({ selected: true })).toBe(true)
        expect(fn({ checked: true })).toBe(true)
        expect(fn({ selected: true, checked: true })).toBe(true)
    })

    it('returns false when neither selected nor checked', async () => {
        const { fn } = await captureExecutedFn(bidiIsSelected, [], false)
        expect(fn({})).toBe(false)
        expect(fn({ selected: false, checked: false })).toBe(false)
    })
})

describe('bidiIsEnabled', () => {
    it('returns false when element is disabled', async () => {
        const { fn } = await captureExecutedFn(bidiIsEnabled, [], true)
        expect(fn({ disabled: true })).toBe(false)
    })

    it('returns true when not disabled and no fieldset ancestor', async () => {
        const { fn } = await captureExecutedFn(bidiIsEnabled)
        const el = { disabled: false, closest: () => null }
        expect(fn(el)).toBe(true)
    })

    it('returns false inside a disabled fieldset with no legend', async () => {
        const { fn } = await captureExecutedFn(bidiIsEnabled)
        const el = {
            disabled: false,
            closest: (selector: string) => {
                if (selector === 'fieldset[disabled]') {
                    return { querySelector: () => null }
                }
                return null
            },
        }
        expect(fn(el)).toBe(false)
    })

    it('returns true inside a disabled fieldset but within the first legend', async () => {
        const { fn } = await captureExecutedFn(bidiIsEnabled)
        const el = {
            disabled: false,
            closest: (selector: string) => {
                if (selector === 'fieldset[disabled]') {
                    return { querySelector: () => ({ contains: (c: any) => c === el }) }
                }
                return null
            },
        }
        expect(fn(el)).toBe(true)
    })
})

describe('bidiClearValue', () => {
    it('throws for disabled elements', async () => {
        const { fn } = await captureExecutedFn(bidiClearValue, [], undefined)
        expect(() => fn({ disabled: true })).toThrow('element not interactable')
    })

    it('throws for readOnly elements', async () => {
        const { fn } = await captureExecutedFn(bidiClearValue, [], undefined)
        expect(() => fn({ readOnly: true, tagName: 'INPUT' })).toThrow('element not interactable')
    })

    it('throws for non-editable elements', async () => {
        const { fn } = await captureExecutedFn(bidiClearValue, [], undefined)
        expect(() => fn({ tagName: 'DIV', isContentEditable: false })).toThrow('element not editable')
    })

    it('clears value on input elements', async () => {
        const { fn } = await captureExecutedFn(bidiClearValue, [], undefined)
        const el = {
            tagName: 'INPUT',
            disabled: false,
            readOnly: false,
            isContentEditable: false,
            value: 'old text',
            scrollIntoView: vi.fn(),
            focus: vi.fn(),
            dispatchEvent: vi.fn(),
            style: {} as any,
        }
        const origWindow = (globalThis as any).window
        try {
            (globalThis as any).window = { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
            fn(el)
            expect(el.value).toBe('')
            expect(el.dispatchEvent).toHaveBeenCalled()
        } finally {
            (globalThis as any).window = origWindow
        }
    })

    it('clears textContent on contentEditable elements', async () => {
        const { fn } = await captureExecutedFn(bidiClearValue, [], undefined)
        const el = {
            tagName: 'DIV',
            disabled: false,
            readOnly: false,
            isContentEditable: true,
            textContent: 'editable text',
            scrollIntoView: vi.fn(),
            focus: vi.fn(),
            dispatchEvent: vi.fn(),
            style: {} as any,
        }
        const origWindow = (globalThis as any).window
        try {
            (globalThis as any).window = { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
            fn(el)
            expect(el.textContent).toBe('')
            expect(el.dispatchEvent).toHaveBeenCalled()
        } finally {
            (globalThis as any).window = origWindow
        }
    })

    it('throws for display:none elements', async () => {
        const { fn } = await captureExecutedFn(bidiClearValue, [], undefined)
        const el = { tagName: 'INPUT', disabled: false, readOnly: false, style: {} as any }
        const origWindow = (globalThis as any).window
        try {
            (globalThis as any).window = { getComputedStyle: () => ({ display: 'none', visibility: 'visible' }) }
            expect(() => fn(el)).toThrow('element not interactable')
        } finally {
            (globalThis as any).window = origWindow
        }
    })
})

describe('bidiClearValue native setter and events', () => {
    it('writes through the prototype setter and fires input then change', async () => {
        const { fn } = await captureExecutedFn(bidiClearValue, [], undefined)
        const { el, protoSet, instanceSet } = makeReactLikeInput('old')
        await withPageGlobals(el, () => fn(el))
        expect(protoSet).toHaveBeenCalledWith('')
        expect(instanceSet).not.toHaveBeenCalled()
        expect(el.dispatchEvent.mock.calls.map((c: any[]) => c[0].type)).toEqual(['input', 'change'])
    })
})

describe('bidi in-page not interactable errors', () => {
    it('names the error so the middleware retry applies', async () => {
        const { getBrowserObject } = await import('@wdio/utils')
        vi.mocked(getBrowserObject).mockReturnValue({
            execute: vi.fn().mockRejectedValue(new Error('Error: element not interactable'))
        } as any)
        const err = await bidiClearValue({ elementId: 'e-ni' } as any).catch((e: Error) => e)
        expect(err).toBeInstanceOf(Error)
        expect((err as Error).name).toBe('element not interactable')
    })

    it('leaves other errors untouched', async () => {
        const { getBrowserObject } = await import('@wdio/utils')
        vi.mocked(getBrowserObject).mockReturnValue({
            execute: vi.fn().mockRejectedValue(new Error('element not editable'))
        } as any)
        const err = await bidiClearValue({ elementId: 'e-ne' } as any).catch((e: Error) => e)
        expect((err as Error).name).toBe('Error')
    })
})

describe('bidiAddValue', () => {
    it('writes through the prototype setter and fires input then change', async () => {
        const { fn } = await captureExecutedFn(bidiAddValue, ['x'], undefined)
        const { el, protoSet, instanceSet } = makeReactLikeInput('ab')
        await withPageGlobals(el, () => fn(el, 'x'))
        expect(protoSet).toHaveBeenCalledWith('abx')
        expect(instanceSet).not.toHaveBeenCalled()
        expect(el.dispatchEvent.mock.calls.map((c: any[]) => c[0].type)).toEqual(['input', 'change'])
    })

    it('routes text with special keys through key actions instead of splicing', async () => {
        const execute = vi.fn().mockResolvedValue(undefined)
        const browser = { execute, inputPerformActions: vi.fn(), inputReleaseActions: vi.fn() }
        const { getBrowserObject } = await import('@wdio/utils')
        vi.mocked(getBrowserObject).mockReturnValue(browser as any)
        const { getParallelContextStore, setParallelContextStore } = await import('../../../src/session/context.js')
        const previousStore = getParallelContextStore()
        setParallelContextStore(new AsyncLocalStorage<string>())
        try {
            await getParallelContextStore().run('ctx-1', () => bidiAddValue({ elementId: 'e-key' } as any, 'q' + Key.Enter))
        } finally {
            setParallelContextStore(previousStore)
        }
        const params = browser.inputPerformActions.mock.calls[0][0]
        expect(params.context).toBe('ctx-1')
        expect(params.actions[0].actions).toEqual([
            { type: 'keyDown', value: 'q' }, { type: 'keyUp', value: 'q' },
            { type: 'keyDown', value: Key.Enter }, { type: 'keyUp', value: Key.Enter }
        ])
        expect(Object.getOwnPropertySymbols(params)).toHaveLength(0)
        expect(browser.inputReleaseActions).toHaveBeenCalledWith({ context: 'ctx-1' })
    })

    it('splices value at cursor position when element is already focused', async () => {
        const { fn } = await captureExecutedFn(bidiAddValue, ['typed'], undefined)
        const el = {
            tagName: 'INPUT',
            disabled: false,
            readOnly: false,
            isContentEditable: false,
            value: 'before after',
            selectionStart: 7,
            selectionEnd: 7,
            scrollIntoView: vi.fn(),
            focus: vi.fn(),
            dispatchEvent: vi.fn(),
            style: {} as any,
        }
        const origWindow = (globalThis as any).window
        const origDoc = (globalThis as any).document
        try {
            (globalThis as any).window = { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
            ;(globalThis as any).document = { activeElement: el }
            fn(el, 'typed')
            expect(el.value).toBe('before typedafter')
            expect(el.dispatchEvent).toHaveBeenCalledTimes(2)
        } finally {
            (globalThis as any).window = origWindow
            ;(globalThis as any).document = origDoc
        }
    })

    it('appends at the end of an element that was not yet focused, ignoring its stale selection', async () => {
        const { fn } = await captureExecutedFn(bidiAddValue, ['typed'], undefined)
        const el = {
            tagName: 'INPUT', disabled: false, readOnly: false, isContentEditable: false,
            value: 'before after', selectionStart: 0, selectionEnd: 0,
            scrollIntoView: vi.fn(), focus: vi.fn(), dispatchEvent: vi.fn(), style: {} as any,
        }
        await withPageGlobals(null, () => fn(el, 'typed'))
        expect(el.focus).toHaveBeenCalled()
        expect(el.value).toBe('before aftertyped')
    })

    it('appends value at end when no selection', async () => {
        const { fn } = await captureExecutedFn(bidiAddValue, ['world'], undefined)
        const el = {
            tagName: 'INPUT',
            disabled: false,
            readOnly: false,
            isContentEditable: false,
            value: 'hello ',
            selectionStart: null,
            selectionEnd: null,
            scrollIntoView: vi.fn(),
            focus: vi.fn(),
            dispatchEvent: vi.fn(),
            style: {} as any,
        }
        const origWindow = (globalThis as any).window
        const origDoc = (globalThis as any).document
        try {
            (globalThis as any).window = { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
            ;(globalThis as any).document = { activeElement: el }
            fn(el, 'world')
            expect(el.value).toBe('hello world')
        } finally {
            (globalThis as any).window = origWindow
            ;(globalThis as any).document = origDoc
        }
    })

    it('appends value at end of textContent when no selection on contentEditable', async () => {
        const { fn } = await captureExecutedFn(bidiAddValue, ['world'], undefined)
        const el = {
            tagName: 'DIV',
            disabled: false,
            readOnly: false,
            isContentEditable: true,
            textContent: 'hello ',
            selectionStart: null,
            selectionEnd: null,
            scrollIntoView: vi.fn(),
            focus: vi.fn(),
            dispatchEvent: vi.fn(),
            style: {} as any,
        }
        const origWindow = (globalThis as any).window
        const origDoc = (globalThis as any).document
        try {
            (globalThis as any).window = { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
            ;(globalThis as any).document = { activeElement: el }
            fn(el, 'world')
            expect(el.textContent).toBe('hello world')
        } finally {
            (globalThis as any).window = origWindow
            ;(globalThis as any).document = origDoc
        }
    })

    it('throws for disabled elements', async () => {
        const { fn } = await captureExecutedFn(bidiAddValue, ['x'], undefined)
        expect(() => fn({ disabled: true }, 'x')).toThrow('element not interactable')
    })

    it('passes the value as a separate argument to execute', async () => {
        const { mockExecute } = await captureExecutedFn(bidiAddValue, ['typed'], undefined)
        expect(mockExecute.mock.calls[0][2]).toBe('typed')
    })
})

describe('bidiAddMaskedValue', () => {
    function makeInput(overrides: Record<string, unknown> = {}) {
        const el: any = {
            tagName: 'INPUT', disabled: false, readOnly: false, isContentEditable: false, value: '',
            scrollIntoView: vi.fn(), focus: vi.fn(), setSelectionRange: vi.fn(), contains: (n: unknown) => n === el,
            shadowRoot: null, getRootNode: () => ({}), ownerDocument: { activeElement: null as unknown }, ...overrides
        }
        return el
    }
    async function runWith(el: any, style = { display: 'block', visibility: 'visible' }) {
        const browser = {
            execute: vi.fn(async (fn: Function, _ref: unknown, ...a: unknown[]) => {
                const g = globalThis as any
                const orig = g.window
                g.window = { getComputedStyle: () => style }
                try { return fn(el, ...a) } finally { g.window = orig }
            }),
            inputPerformActions: vi.fn(),
            inputReleaseActions: vi.fn()
        }
        const { getBrowserObject } = await import('@wdio/utils')
        vi.mocked(getBrowserObject).mockReturnValue(browser as any)
        const err = await bidiAddMaskedValue({ elementId: 'e-masked' } as any, 'secret').catch((e: Error) => e)
        return { browser, err }
    }

    it.each([
        ['non-editable', { tagName: 'DIV' }, undefined, 'element not editable'],
        ['readOnly', { readOnly: true }, undefined, 'element not interactable'],
        ['hidden', {}, { display: 'none', visibility: 'visible' }, 'element not interactable']
    ])('throws before any key action for a %s target', async (_n, overrides, style, message) => {
        const el = makeInput(overrides)
        const { browser, err } = await runWith(el, style)
        expect((err as Error).message).toBe(message)
        expect(el.focus).not.toHaveBeenCalled()
        expect(browser.inputPerformActions).not.toHaveBeenCalled()
    })

    it('throws before any key action when focus lands elsewhere', async () => {
        const el = makeInput()
        el.getRootNode = () => ({ activeElement: { tagName: 'INPUT' } })
        const { browser, err } = await runWith(el)
        expect(el.focus).toHaveBeenCalledOnce()
        expect((err as Error).message).toContain('could not receive focus')
        expect(browser.inputPerformActions).not.toHaveBeenCalled()
    })

    it('accepts focus that lands on the element in its shadow root', async () => {
        const el = makeInput()
        el.getRootNode = () => ({ activeElement: el })
        const { fn } = await captureExecutedFn(bidiAddMaskedValue, [''], undefined)
        const g = globalThis as any
        const orig = g.window
        g.window = { getComputedStyle: () => ({ display: 'block', visibility: 'visible' }) }
        try { expect(() => fn(el)).not.toThrow() } finally { g.window = orig }
    })
})

describe('bidiGetAttribute', () => {
    function makeEl(attrs: Record<string, string>, props: Record<string, unknown> = {}) {
        return {
            ...props,
            hasAttribute: (n: string) => n.toLowerCase() in attrs,
            getAttribute: (n: string) => attrs[n.toLowerCase()] ?? null
        }
    }

    it('returns the attribute, not the live value, after typing', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['value'])
        expect(fn(makeEl({ value: 'initial' }, { tagName: 'INPUT', value: 'edited' }), 'value')).toBe('initial')
    })

    it.each([
        ['input value', { tagName: 'INPUT', value: '' }, 'value'],
        ['input type', { tagName: 'INPUT', type: 'text' }, 'type'],
        ['checkbox value', { tagName: 'INPUT', type: 'checkbox', value: 'on' }, 'value'],
        ['div title', { tagName: 'DIV', title: '' }, 'title'],
        ['div class', { tagName: 'DIV', className: '' }, 'class'],
        ['form action', { tagName: 'FORM', action: 'https://example.com/' }, 'action'],
        ['li value', { tagName: 'LI', value: 3 }, 'value'],
        ['style', { tagName: 'DIV', style: { cssText: 'color: red;' } }, 'style'],
        ['spellcheck', { tagName: 'DIV', spellcheck: true }, 'spellcheck']
    ])('returns null for a missing %s attribute despite a DOM property', async (_n, props, attr) => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, [attr])
        expect(fn(makeEl({}, props), attr)).toBeNull()
    })

    it('returns null for checked when only the property is true', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['checked'])
        expect(fn(makeEl({}, { tagName: 'INPUT', type: 'checkbox', checked: true }), 'checked')).toBeNull()
    })

    it('returns null for selected when only the property is true', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['selected'])
        expect(fn(makeEl({}, { tagName: 'OPTION', selected: true }), 'selected')).toBeNull()
    })

    it('returns "true" for a present boolean attribute regardless of its value or property', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['selected'])
        expect(fn(makeEl({ selected: '' }, { tagName: 'OPTION', selected: false }), 'selected')).toBe('true')
        expect(fn(makeEl({ disabled: 'false' }, { tagName: 'INPUT' }), 'DISABLED')).toBe('true')
    })

    it('returns the raw href, not the resolved URL', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['href'])
        expect(fn(makeEl({ href: '/x' }, { tagName: 'A', href: 'https://example.com/x' }), 'href')).toBe('/x')
    })

    it('returns non-boolean attribute values verbatim', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['maxlength'])
        expect(fn(makeEl({ maxlength: '5' }, { tagName: 'INPUT', maxLength: 5 }), 'maxlength')).toBe('5')
    })
})

const enabled = { disabled: false, closest: () => null }

describe('bidiSelectByVisibleText', () => {
    it('selects option by visible text', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByVisibleText, ['Option Text'], undefined)
        const dispatchEvent = vi.fn()
        const option = { ...enabled, textContent: 'Option Text', selected: false }
        expect(fn({ options: [option], dispatchEvent }, 'text', 'Option Text')).toEqual({ selected: true, count: 1 })
        expect(option.selected).toBe(true)
        expect(dispatchEvent).toHaveBeenCalled()
    })

    it('matches the option label like classic', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByVisibleText, ['Pretty'], undefined)
        const option = { ...enabled, textContent: 'raw', label: ' Pretty ', selected: false }
        expect(fn({ options: [option], dispatchEvent: vi.fn() }, 'text', 'Pretty').selected).toBe(true)
        expect(option.selected).toBe(true)
    })

    it('collapses whitespace when matching', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByVisibleText, ['Option Text'], undefined)
        const dispatchEvent = vi.fn()
        const option = { ...enabled, textContent: '  Option   Text  ', selected: false }
        fn({ options: [option], dispatchEvent }, 'text', 'Option Text')
        expect(option.selected).toBe(true)
    })

    it('does not select when no text matches', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByVisibleText, ['Not Found'], undefined)
        const dispatchEvent = vi.fn()
        const option = { ...enabled, textContent: 'Different', selected: false }
        expect(fn({ options: [option], dispatchEvent }, 'text', 'Not Found')).toEqual({ selected: false, count: 1 })
        expect(option.selected).toBe(false)
    })

    it.each([
        ['select', { disabled: true }, { ...enabled }],
        ['option', { disabled: false }, { ...enabled, disabled: true }],
        ['optgroup', { disabled: false }, { ...enabled, closest: (sel: string) => sel === 'optgroup[disabled]' ? {} : null }]
    ])('reports a disabled %s without selecting', async (source, selectProps, optionProps) => {
        const { fn } = await captureExecutedFn(bidiSelectByVisibleText, ['A'], undefined)
        const dispatchEvent = vi.fn()
        const option = { ...optionProps, textContent: 'A', selected: false }
        expect(fn({ ...selectProps, options: [option], dispatchEvent }, 'text', 'A'))
            .toEqual({ selected: false, count: 1, disabled: source })
        expect(option.selected).toBe(false)
        expect(dispatchEvent).not.toHaveBeenCalled()
    })
})

describe('bidiSelectByAttribute', () => {
    it('selects option by attribute match', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByAttribute, ['value', 'target'], undefined)
        const dispatchEvent = vi.fn()
        const option = { ...enabled, selected: false, getAttribute: (name: string) => name === 'value' ? 'target' : null, value: 'other' }
        expect(fn({ options: [option], dispatchEvent }, 'attribute', 'value', 'target').selected).toBe(true)
        expect(option.selected).toBe(true)
    })

    it('returns not selected when no option matches', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByAttribute, ['value', 'x'], undefined)
        const option = { ...enabled, selected: false, getAttribute: () => null, value: 'other' }
        expect(fn({ options: [option], dispatchEvent: vi.fn() }, 'attribute', 'value', 'x').selected).toBe(false)
        expect(option.selected).toBe(false)
    })

    it('ignores a property that has no matching attribute, like the Classic XPath', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByAttribute, ['value', 'prop-match'], undefined)
        const dispatchEvent = vi.fn()
        const option = { ...enabled, selected: false, getAttribute: () => null, value: 'prop-match' }
        expect(fn({ options: [option], dispatchEvent }, 'attribute', 'value', 'prop-match').selected).toBe(false)
        expect(option.selected).toBe(false)
    })

    it.each([
        [' a ', 'a', true],
        ['a  b', 'a b', true],
        ['a', ' a ', true],
        [`a${String.fromCharCode(0xa0)}b`, 'a b', false]
    ])('matches attribute %j against %j like XPath normalize-space: %s', async (attr, search, expected) => {
        const { fn } = await captureExecutedFn(bidiSelectByAttribute, ['value', search], undefined)
        const option = { ...enabled, selected: false, getAttribute: (name: string) => name === 'value' ? attr : null, value: 'other' }
        expect(fn({ options: [option], dispatchEvent: vi.fn() }, 'attribute', ' value ', search).selected).toBe(expected)
        expect(option.selected).toBe(expected)
    })

    it('reports a disabled option without selecting', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByAttribute, ['value', 'a'], undefined)
        const option = { ...enabled, disabled: true, selected: false, getAttribute: () => 'a' }
        expect(fn({ options: [option], dispatchEvent: vi.fn() }, 'attribute', 'value', 'a').disabled).toBe('option')
        expect(option.selected).toBe(false)
    })
})

describe('bidiSelectByIndex', () => {
    it('selects option at the given index', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByIndex, [1], undefined)
        const dispatchEvent = vi.fn()
        const option0 = { ...enabled, selected: false }
        const option1 = { ...enabled, selected: false }
        expect(fn({ options: [option0, option1], dispatchEvent }, 'index', 1)).toEqual({ selected: true, count: 2 })
        expect(option0.selected).toBe(false)
        expect(option1.selected).toBe(true)
        expect(dispatchEvent).toHaveBeenCalled()
    })

    it('does nothing when index is out of bounds', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByIndex, [5], undefined)
        const dispatchEvent = vi.fn()
        const option = { ...enabled, selected: false }
        expect(fn({ options: [option], dispatchEvent }, 'index', 5)).toEqual({ selected: false, count: 1 })
        expect(option.selected).toBe(false)
        expect(dispatchEvent).not.toHaveBeenCalled()
    })

    it('reports a disabled option without selecting', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByIndex, [0], undefined)
        const option = { ...enabled, disabled: true, selected: false }
        expect(fn({ options: [option], dispatchEvent: vi.fn() }, 'index', 0)).toEqual({ selected: false, count: 1, disabled: 'option' })
        expect(option.selected).toBe(false)
    })
})

describe('exec caching', () => {
    it('caches the browser on the element to avoid repeated getBrowserObject calls', async () => {
        const mockExecute = vi.fn().mockResolvedValue('result')
        const { getBrowserObject } = await import('@wdio/utils')
        vi.mocked(getBrowserObject).mockReturnValue({ execute: mockExecute } as any)

        const element = { elementId: 'cache-test' } as any
        await bidiGetText(element)
        expect(element.__bidiBrowser).toBeDefined()

        // Second call — getBrowserObject should NOT be called again
        vi.mocked(getBrowserObject).mockClear()
        await bidiGetText(element)
        expect(getBrowserObject).not.toHaveBeenCalled()
    })
})

describe('bidiAssertClickable', () => {
    function makeEl(overrides: Record<string, unknown> = {}) {
        const el: any = {
            tagName: 'BUTTON', id: 'b', getAttribute: () => null,
            getClientRects: () => [{ left: 10, top: 20, width: 100, height: 40 }],
            scrollIntoView: vi.fn(), contains: () => false, shadowRoot: null,
            getRootNode: () => ({}), ...overrides
        }
        el.contains = overrides.contains ?? ((n: unknown) => n === el)
        return el
    }
    function run(fn: Function, el: any, hit: unknown, win = { innerWidth: 800, innerHeight: 600 }) {
        const doc = { elementFromPoint: vi.fn().mockReturnValue(hit) }
        const g = globalThis as any
        const orig = { window: g.window, document: g.document }
        try {
            g.window = win
            g.document = doc
            return { result: fn(el), doc }
        } finally {
            g.window = orig.window
            g.document = orig.document
        }
    }

    it('executes one script with the element ref', async () => {
        const { mockExecute } = await captureExecutedFn(bidiAssertClickable, [], { ok: true })
        expect(mockExecute).toHaveBeenCalledOnce()
        expect(mockExecute.mock.calls[0][1]).toEqual({ [ELEMENT_KEY]: 'elem-test' })
    })

    it('reports ok when the element or a descendant is hit', async () => {
        const { fn } = await captureExecutedFn(bidiAssertClickable, [], { ok: true })
        const el = makeEl()
        expect(run(fn, el, el).result).toMatchObject({ ok: true, x: 60, y: 40 })
        const child = { tagName: 'SPAN', id: '', getAttribute: () => null }
        el.contains = (n: unknown) => n === child
        expect(run(fn, el, child).result.ok).toBe(true)
    })

    it('reports a description of the intercepting element', async () => {
        const { fn } = await captureExecutedFn(bidiAssertClickable, [], { ok: true })
        const other = { tagName: 'DIV', id: '', getAttribute: () => 'overlay' }
        expect(run(fn, makeEl(), other).result).toMatchObject({
            ok: false, target: '<button id="b">', hit: '<div class="overlay">'
        })
    })

    it('scrolls into view only when the center is outside the viewport', async () => {
        const { fn } = await captureExecutedFn(bidiAssertClickable, [], { ok: true })
        const inView = makeEl()
        run(fn, inView, inView)
        expect(inView.scrollIntoView).not.toHaveBeenCalled()
        const outside = makeEl()
        run(fn, outside, outside, { innerWidth: 50, innerHeight: 600 })
        expect(outside.scrollIntoView).toHaveBeenCalledWith({ block: 'center', inline: 'center' })
    })

    it('uses the shadow root of the element for the lookup', async () => {
        const { fn } = await captureExecutedFn(bidiAssertClickable, [], { ok: true })
        const el = makeEl()
        const rootLookup = vi.fn().mockReturnValue(el)
        el.getRootNode = () => ({ elementFromPoint: rootLookup })
        const { doc } = run(fn, el, null)
        expect(rootLookup).toHaveBeenCalledWith(60, 40)
        expect(doc.elementFromPoint).not.toHaveBeenCalled()
    })

    it('throws the chromedriver-style error when not ok', async () => {
        const { getBrowserObject } = await import('@wdio/utils')
        vi.mocked(getBrowserObject).mockReturnValue({
            execute: vi.fn().mockResolvedValue({ ok: false, x: 60, y: 40, target: '<button id="b">', hit: '<div>' })
        } as any)
        const err = await bidiAssertClickable({ elementId: 'e-throw' } as any).catch((e: Error) => e)
        expect(err.name).toBe('element click intercepted')
        expect(err.message).toBe('element click intercepted: Element <button id="b"> is not clickable at point (60, 40). Other element would receive the click: <div>')
    })

    it.each([
        ['no client rects', [], 'element is not displayed'],
        ['zero width', [{ left: 10, top: 20, width: 0, height: 40 }], 'element has zero size'],
        ['zero height', [{ left: 10, top: 20, width: 100, height: 0 }], 'element has zero size']
    ])('reports not interactable without hit-testing for %s', async (_n, rects, reason) => {
        const { fn } = await captureExecutedFn(bidiAssertClickable, [], { ok: true })
        const { result, doc } = run(fn, makeEl({ getClientRects: () => rects }), null)
        expect(result).toMatchObject({ ok: false, notInteractable: reason })
        expect(doc.elementFromPoint).not.toHaveBeenCalled()
    })

    it('throws element not interactable when the page reports it', async () => {
        const { getBrowserObject } = await import('@wdio/utils')
        vi.mocked(getBrowserObject).mockReturnValue({
            execute: vi.fn().mockResolvedValue({ ok: false, x: 0, y: 0, target: '<a>', hit: 'null', notInteractable: 'element has zero size' })
        } as any)
        const err = await bidiAssertClickable({ elementId: 'e-zero' } as any).catch((e: Error) => e)
        expect(err.name).toBe('element not interactable')
        expect(err.message).toBe('element not interactable: element has zero size')
    })

    it('resolves when ok', async () => {
        const { getBrowserObject } = await import('@wdio/utils')
        vi.mocked(getBrowserObject).mockReturnValue({ execute: vi.fn().mockResolvedValue({ ok: true }) } as any)
        await expect(bidiAssertClickable({ elementId: 'e-ok' } as any)).resolves.toBeUndefined()
    })
})
