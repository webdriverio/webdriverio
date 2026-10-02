import { describe, expect, it } from 'vitest'

import { assertValues, placeholdersIn, redact, substitute } from '../src/redact.js'

describe('placeholders', () => {
    it('lists the placeholder names of a text once', () => {
        expect(placeholdersIn('Log in as {{user}} with {{ password }} and {{user}}')).toEqual(['user', 'password'])
        expect(placeholdersIn('no placeholders')).toEqual([])
    })

    it('fails early when a placeholder has no value', () => {
        expect(() => assertValues('Log in as {{user}} with {{password}}', { user: 'alice' }))
            .toThrow('No value for {{password}}. Pass it in `values`.')
        expect(() => assertValues('Log in as {{user}}', { user: 'alice' })).not.toThrow()
    })
})

describe('substitute', () => {
    it('replaces placeholders in strings, arrays and objects', () => {
        const values = { user: 'alice', password: 's3cr3t' }
        expect(substitute('{{user}}', values)).toBe('alice')
        expect(substitute({ target: 'e3', text: '{{password}}', list: ['{{user}}'] }, values))
            .toEqual({ target: 'e3', text: 's3cr3t', list: ['alice'] })
    })

    it('keeps unknown placeholders and non-string values', () => {
        expect(substitute({ text: '{{other}}', px: 600, ok: true }, { user: 'alice' }))
            .toEqual({ text: '{{other}}', px: 600, ok: true })
    })
})

describe('redact', () => {
    it('replaces every value with its placeholder', () => {
        const values = { user: 'alice', password: 's3cr3t' }
        expect(redact('await $(\'#user\').setValue(\'alice\'); await $(\'#pw\').setValue(\'s3cr3t\')', values))
            .toBe('await $(\'#user\').setValue(\'{{user}}\'); await $(\'#pw\').setValue(\'{{password}}\')')
        expect(redact({ text: 's3cr3t', nested: ['alice'] }, values)).toEqual({ text: '{{password}}', nested: ['{{user}}'] })
    })

    it('replaces the longer value first when one value contains another', () => {
        expect(redact('alice@example.com', { user: 'alice', email: 'alice@example.com' })).toBe('{{email}}')
    })

    it('ignores empty values', () => {
        expect(redact('text', { empty: '' })).toBe('text')
    })
})
