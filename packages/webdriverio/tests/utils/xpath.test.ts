/**
 * @vitest-environment jsdom
 */
import { describe, expect, it } from 'vitest'

import { toXPathStringLiteral } from '../../src/utils/xpath.js'

const evaluate = (literal: string) => document.evaluate(`string(${literal})`, document, null, XPathResult.STRING_TYPE, null).stringValue

describe('toXPathStringLiteral', () => {
    it('wraps values without double quotes in double quotes', () => {
        expect(toXPathStringLiteral('foobar')).toBe('"foobar"')
        expect(toXPathStringLiteral("Don't Allow")).toBe('"Don\'t Allow"')
        expect(toXPathStringLiteral('')).toBe('""')
    })

    it('wraps values with double quotes but no apostrophe in single quotes', () => {
        expect(toXPathStringLiteral('12" monitor')).toBe('\'12" monitor\'')
    })

    it('uses concat() when the value contains both quote types', () => {
        expect(toXPathStringLiteral('John\'s 12" monitor')).toBe('concat("John\'s 12", \'"\', " monitor")')
        expect(toXPathStringLiteral('"John\'s monitor"')).toBe('concat(\'"\', "John\'s monitor", \'"\')')
    })

    it.each([
        'foobar',
        '',
        "Don't Allow",
        "a''b",
        '12" monitor',
        '""',
        'John\'s 12" monitor',
        '"John\'s monitor"',
        '\'"',
        '"\'"\'',
        'He said "Don\'t"'
    ])('gives a literal that XPath evaluates back to %j', (value) => {
        expect(evaluate(toXPathStringLiteral(value))).toBe(value)
    })
})
