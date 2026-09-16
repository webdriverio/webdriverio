import { expect, describe, it } from 'vitest'
import { androidButtonSelector, toXPathStringLiteral } from '../../src/utils/mobileDialog.js'

describe('toXPathStringLiteral', () => {
    it('wraps values without quotes in single quotes', () => {
        expect(toXPathStringLiteral('OK')).toBe("'OK'")
        expect(toXPathStringLiteral('Allow')).toBe("'Allow'")
    })

    it('uses double quotes when the value contains an apostrophe', () => {
        expect(toXPathStringLiteral("Don't Allow")).toBe('"Don\'t Allow"')
    })

    it('uses concat() when the value contains both quote types', () => {
        expect(toXPathStringLiteral('He said "Don\'t"')).toBe(
            'concat(\'He said "Don\', "\'", \'t"\')'
        )
    })

    it('handles consecutive apostrophes', () => {
        expect(toXPathStringLiteral("a''b")).toBe('"a\'\'b"')
    })
})

describe('androidButtonSelector', () => {
    it('builds a valid XPath for common button labels', () => {
        expect(androidButtonSelector('OK')).toBe("//android.widget.Button[@text='OK']")
        expect(androidButtonSelector("Don't Allow")).toBe(
            '//android.widget.Button[@text="Don\'t Allow"]'
        )
    })
})
