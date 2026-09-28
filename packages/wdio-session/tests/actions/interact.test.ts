import { describe, it, expect } from 'vitest'

import { normalizeUrl, parseKeys } from '../../src/actions/interact.js'

describe('parseKeys', () => {
    it('keeps single keys and characters', () => {
        expect(parseKeys('Enter')).toEqual(['Enter'])
        expect(parseKeys('a')).toEqual(['a'])
        expect(parseKeys('+')).toEqual(['+'])
    })

    it('splits combinations and normalizes names', () => {
        expect(parseKeys('Control+a')).toEqual(['Control', 'a'])
        expect(parseKeys('ctrl+shift+Tab')).toEqual(['Control', 'Shift', 'Tab'])
        expect(parseKeys('cmd+Plus')).toEqual(['Command', '+'])
        expect(parseKeys('Shift++')).toEqual(['Shift', '+'])
        expect(parseKeys('esc')).toEqual(['Escape'])
        expect(parseKeys('arrowdown')).toEqual(['ArrowDown'])
        expect(parseKeys('PageUp')).toEqual(['PageUp'])
        expect(parseKeys('Down')).toEqual(['ArrowDown'])
    })

    it('rejects unknown key names', () => {
        expect(() => parseKeys('Control+Foo')).toThrow('Unknown key "Foo".')
        expect(() => parseKeys('')).toThrow('No keys given.')
    })
})

describe('normalizeUrl', () => {
    it('keeps URLs with a scheme and relative paths', () => {
        expect(normalizeUrl('https://example.com')).toBe('https://example.com')
        expect(normalizeUrl('about:blank')).toBe('about:blank')
        expect(normalizeUrl('data:text/html,hi')).toBe('data:text/html,hi')
        expect(normalizeUrl('/login')).toBe('/login')
        expect(normalizeUrl('./x.html')).toBe('./x.html')
    })

    it('adds a scheme to bare hosts', () => {
        expect(normalizeUrl('example.com')).toBe('https://example.com')
        expect(normalizeUrl('example.com/path?q=1')).toBe('https://example.com/path?q=1')
        expect(normalizeUrl('localhost:8080/form.html')).toBe('http://localhost:8080/form.html')
        expect(normalizeUrl('127.0.0.1:3000')).toBe('http://127.0.0.1:3000')
    })

    it('leaves other strings to baseUrl handling', () => {
        expect(normalizeUrl('login')).toBe('login')
    })
})
