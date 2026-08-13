import path from 'node:path'
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { ELEMENT_KEY } from 'webdriver'

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

    it('returns innerText from the DOM element', async () => {
        const { fn } = await captureExecutedFn(bidiGetText)
        expect(fn({ innerText: 'some text' })).toBe('some text')
        expect(fn({ innerText: '' })).toBe('')
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

describe('bidiAddValue', () => {
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

    it('throws for disabled elements', async () => {
        const { fn } = await captureExecutedFn(bidiAddValue, ['x'], undefined)
        expect(() => fn({ disabled: true }, 'x')).toThrow('element not interactable')
    })

    it('passes the value as a separate argument to execute', async () => {
        const { mockExecute } = await captureExecutedFn(bidiAddValue, ['typed'], undefined)
        expect(mockExecute.mock.calls[0][2]).toBe('typed')
    })
})

describe('bidiGetAttribute', () => {
    it('returns style.cssText when attr is "style"', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['style'], 'attr-result')
        const el = { style: { cssText: 'color: red; font-size: 16px;' } }
        expect(fn(el, 'style')).toBe('color: red; font-size: 16px;')
    })

    it('returns null when style property is missing', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['style'])
        expect(fn({ style: undefined }, 'style')).toBeNull()
    })

    it('returns "true" for selected option', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['selected'])
        expect(fn({ tagName: 'OPTION', selected: true }, 'selected')).toBe('true')
    })

    it('returns null for unselected option', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['selected'])
        expect(fn({ tagName: 'OPTION', selected: false }, 'selected')).toBeNull()
    })

    it('returns "true" for checked checkbox, null for unchecked', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['checked'])
        expect(fn({ tagName: 'INPUT', type: 'checkbox', checked: true }, 'checked')).toBe('true')
        expect(fn({ tagName: 'INPUT', type: 'checkbox', checked: false }, 'checked')).toBeNull()
    })

    it('returns resolved href on anchor elements', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['href'])
        const el = { tagName: 'A', href: 'https://example.com/page', getAttribute: () => '/page' }
        expect(fn(el, 'href')).toBe('https://example.com/page')
    })

    it('returns resolved src on img elements', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['src'])
        const el = { tagName: 'IMG', src: 'https://example.com/img.png', getAttribute: () => '/img.png' }
        expect(fn(el, 'src')).toBe('https://example.com/img.png')
    })

    it('returns raw attribute for href when property is empty', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['href'])
        // When el.href is empty, String(el.href) returns '' — the resolved property wins
        const el = { tagName: 'A', href: '', getAttribute: (name: string) => name === 'href' ? '/page' : null }
        expect(fn(el, 'href')).toBe('')
    })

    it('normalizes spellcheck when attr is "false"', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['spellcheck'])
        const el = { tagName: 'DIV', spellcheck: true, getAttribute: () => 'false' }
        expect(fn(el, 'spellcheck')).toBe('false')
    })

    it('returns "true" for boolean properties when present', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['disabled'])
        const el = { tagName: 'INPUT', disabled: true, getAttribute: (name: string) => name === 'disabled' ? '' : null }
        expect(fn(el, 'disabled')).toBe('true')
    })

    it('returns null for boolean properties when absent', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['hidden'])
        expect(fn({ tagName: 'DIV', getAttribute: () => null, hidden: false }, 'hidden')).toBeNull()
    })

    it('returns li value from attribute rather than numeric li.value', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['value'])
        const el = { tagName: 'LI', value: 3, getAttribute: (name: string) => name === 'value' ? 'custom-value' : null }
        expect(fn(el, 'value')).toBe('custom-value')
    })

    it('falls back to DOM property when attribute is absent', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['class'])
        const el = { tagName: 'DIV', className: 'my-class', getAttribute: () => null }
        expect(fn(el, 'class')).toBe('my-class')
    })

    it('returns null when both property and attribute are absent', async () => {
        const { fn } = await captureExecutedFn(bidiGetAttribute, ['data-nope'])
        expect(fn({ tagName: 'DIV', getAttribute: () => null }, 'data-nope')).toBeNull()
    })
})

describe('bidiSelectByVisibleText', () => {
    it('selects option by visible text', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByVisibleText, ['Option Text'], undefined)
        const dispatchEvent = vi.fn()
        const option = { textContent: 'Option Text', selected: false }
        fn({ options: [option], dispatchEvent }, 'Option Text')
        expect(option.selected).toBe(true)
        expect(dispatchEvent).toHaveBeenCalled()
    })

    it('collapses whitespace when matching', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByVisibleText, ['Option Text'], undefined)
        const dispatchEvent = vi.fn()
        const option = { textContent: '  Option   Text  ', selected: false }
        fn({ options: [option], dispatchEvent }, 'Option Text')
        expect(option.selected).toBe(true)
    })

    it('does not select when no text matches', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByVisibleText, ['Not Found'], undefined)
        const dispatchEvent = vi.fn()
        const option = { textContent: 'Different', selected: false }
        fn({ options: [option], dispatchEvent }, 'Not Found')
        expect(option.selected).toBe(false)
    })
})

describe('bidiSelectByAttribute', () => {
    it('selects option by attribute match', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByAttribute, ['value', 'target'], undefined)
        const dispatchEvent = vi.fn()
        const option = { selected: false, getAttribute: (name: string) => name === 'value' ? 'target' : null, value: 'other' }
        fn({ options: [option], dispatchEvent }, 'value', 'target')
        expect(option.selected).toBe(true)
    })

    it('selects option by property match when attribute does not match', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByAttribute, ['value', 'prop-match'], undefined)
        const dispatchEvent = vi.fn()
        const option = { selected: false, getAttribute: () => null, value: 'prop-match' }
        fn({ options: [option], dispatchEvent }, 'value', 'prop-match')
        expect(option.selected).toBe(true)
    })
})

describe('bidiSelectByIndex', () => {
    it('selects option at the given index', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByIndex, [1], undefined)
        const dispatchEvent = vi.fn()
        const option0 = { selected: false }
        const option1 = { selected: false }
        fn({ options: [option0, option1], dispatchEvent }, 1)
        expect(option0.selected).toBe(false)
        expect(option1.selected).toBe(true)
        expect(dispatchEvent).toHaveBeenCalled()
    })

    it('does nothing when index is out of bounds', async () => {
        const { fn } = await captureExecutedFn(bidiSelectByIndex, [5], undefined)
        const dispatchEvent = vi.fn()
        const option = { selected: false }
        fn({ options: [option], dispatchEvent }, 5)
        expect(option.selected).toBe(false)
        expect(dispatchEvent).not.toHaveBeenCalled()
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
