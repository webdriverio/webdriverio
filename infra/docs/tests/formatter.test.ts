import { describe, it, expect } from 'vitest'
import { parse } from 'comment-parser'

import formatter from '../src/utils/formatter.js'

function format (source: string, filename = '/packages/webdriverio/src/commands/browser/waitUntil.ts') {
    return formatter({
        filename,
        javadoc: parse(source, { spacing: 'preserve' })
    })
}

describe('formatter', () => {
    it('extracts command metadata from JSDoc tags', () => {
        const doc = format(`/**
 * Wait until a condition is true.
 * @param {Function} condition
 * @param {number=} options.timeout
 * @returns {Promise<boolean>}  the result
 * @throws {Error} when the condition times out
 * @deprecated use waitFor instead
 * @example examples/waitUntil.js
 * @skipAwait
 * @support ["ios","android"]
 */
`)

        expect(doc.command).toBe('waitUntil')
        expect(doc.isElementScope).toBe(false)
        expect(doc.isSkipAwait).toBe(true)
        expect(doc.deprecated).toContain('use waitFor instead')
        expect(doc.paramString).toBe('condition, { timeout }')
        expect(doc.paramTags).toHaveLength(2)
        expect(doc.paramTags[1].optional).toBe(true)
        expect(doc.returns?.type).toBe('Promise<boolean>')
        expect(doc.throwsTags).toHaveLength(1)
        expect(doc.exampleReferences).toEqual(['examples/waitUntil.js'])
        expect(doc.support).toEqual(['ios', 'android'])
        expect(doc.customEditUrl).toContain('packages/webdriverio/src/commands/browser/waitUntil.ts')
    })

    it('marks element-scope commands and parses inline examples', () => {
        const doc = format(`/**
 * Click the element
 * <example>
    :click.js
    await $('elem').click()
 * </example>
 */
`, '/packages/webdriverio/src/commands/element/click.ts')

        expect(doc.isElementScope).toBe(true)
        expect(doc.examples).toEqual([{
            file: 'click.js',
            format: 'js',
            code: 'await $(\'elem\').click()'
        }])
        expect(doc.description).not.toContain('<example>')
    })
})
