import { describe, it, expect } from 'vitest'
import { parseAccessibilitySelectorString, parseAccessibilitySelector } from '../src/utils/accessibilityLocator.js'
import { StrictSelectorError } from '../src/errors/StrictSelectorError.js'

describe('parseAccessibilitySelectorString', () => {
    it('should parse accessibility selector with name only', () => {
        const result = parseAccessibilitySelectorString('accessibility/Submit')
        expect(result).toEqual({ name: 'Submit' })
    })

    it('should parse accessibility selector with name and role', () => {
        const result = parseAccessibilitySelectorString('accessibility/Submit[role=button]')
        expect(result).toEqual({ name: 'Submit', role: 'button' })
    })

    it('should handle accessibility selector with spaces in name', () => {
        const result = parseAccessibilitySelectorString('accessibility/Click here to continue')
        expect(result).toEqual({ name: 'Click here to continue' })
    })

    it('should return null for non-accessibility selectors', () => {
        expect(parseAccessibilitySelectorString('#myId')).toBeNull()
        expect(parseAccessibilitySelectorString('.myClass')).toBeNull()
        expect(parseAccessibilitySelectorString('aria/foobar')).toBeNull()
    })

    it('should handle role with special characters', () => {
        const result = parseAccessibilitySelectorString('accessibility/Login[role=menuitem]')
        expect(result).toEqual({ name: 'Login', role: 'menuitem' })
    })

    it('should handle name with brackets that are not role', () => {
        const result = parseAccessibilitySelectorString('accessibility/Item (1)')
        expect(result).toEqual({ name: 'Item (1)' })
    })

    it('should handle empty name after prefix', () => {
        const result = parseAccessibilitySelectorString('accessibility/')
        expect(result).toEqual({ name: '' })
    })
})

describe('parseAccessibilitySelector (JSON parsing)', () => {
    it('should parse JSON string with name only', () => {
        const result = parseAccessibilitySelector(JSON.stringify({ name: 'Submit' }))
        expect(result).toEqual({ name: 'Submit' })
    })

    it('should parse JSON string with name and role', () => {
        const result = parseAccessibilitySelector(JSON.stringify({ name: 'Submit', role: 'button' }))
        expect(result).toEqual({ name: 'Submit', role: 'button' })
    })

    it('should fallback to plain string if not valid JSON', () => {
        const result = parseAccessibilitySelector('just a plain name')
        expect(result).toEqual({ name: 'just a plain name' })
    })
})

describe('StrictSelectorError', () => {
    it('should create error with correct message', () => {
        const error = new StrictSelectorError('accessibility/Submit', 3, ['button#a', 'button#b', 'button#c'])
        expect(error.name).toBe('StrictSelectorError')
        expect(error.selector).toBe('accessibility/Submit')
        expect(error.count).toBe(3)
        expect(error.descriptors).toEqual(['button#a', 'button#b', 'button#c'])
        expect(error.message).toContain('Strict mode violation')
        expect(error.message).toContain('3 elements')
    })

    it('should include up to 3 descriptors in message', () => {
        const error = new StrictSelectorError('accessibility/Item', 5, ['desc1', 'desc2', 'desc3', 'desc4', 'desc5'])
        expect(error.message).toContain('desc1, desc2, desc3')
        expect(error.message).not.toContain('desc4')
        expect(error.message).not.toContain('desc5')
    })

    it('should be instanceof Error', () => {
        const error = new StrictSelectorError('test', 2, [])
        expect(error).toBeInstanceOf(Error)
    })
})

/**
 * Regression tests to ensure accessibility changes don't break existing selectors
 */
describe('Regression: Existing selectors still work', () => {
    // Import at top of file already has findStrategy via accessibilityLocator
    // These tests verify findStrategy behavior directly

    it('aria/ selector should still use xpath strategy', async () => {
        const { findStrategy } = await import('../src/utils/findStrategy.js')
        const result = findStrategy('aria/Submit Button')
        expect(result.using).toBe('xpath')
        expect(result.value).toContain('aria-label')
    })

    it('accessibility/ prefix should not affect regular CSS selectors', async () => {
        const { findStrategy } = await import('../src/utils/findStrategy.js')
        // Regular CSS that happens to contain "accessibility"
        const result = findStrategy('.accessibility-button')
        expect(result.using).toBe('css selector')
        expect(result.value).toBe('.accessibility-button')
    })

    it('accessibility/ prefix should not affect ID selectors', async () => {
        const { findStrategy } = await import('../src/utils/findStrategy.js')
        const result = findStrategy('#accessibility-panel')
        expect(result.using).toBe('css selector')
        expect(result.value).toBe('#accessibility-panel')
    })

    it('deep selector should still work', async () => {
        const { findStrategy } = await import('../src/utils/findStrategy.js')
        const result = findStrategy('>>>.shadow-element')
        expect(result.using).toBe('shadow')
        expect(result.value).toBe('.shadow-element')
    })

    it('xpath selector should still work', async () => {
        const { findStrategy } = await import('../src/utils/findStrategy.js')
        const result = findStrategy('//button[@id="submit"]')
        expect(result.using).toBe('xpath')
    })

    it('text selector should still work', async () => {
        const { findStrategy } = await import('../src/utils/findStrategy.js')
        const result = findStrategy('=Click Me')
        expect(result.using).toBe('link text')
        expect(result.value).toBe('Click Me')
    })
})

