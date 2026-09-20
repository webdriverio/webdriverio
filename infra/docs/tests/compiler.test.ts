import { describe, it, expect } from 'vitest'

import compiler from '../src/utils/compiler.js'

describe('compiler', () => {
    it('returns the JSDoc header that precedes the default export', () => {
        const source = `/**
 * Click an element
 * @param {string} selector
 */
export default function click () {}
`
        expect(compiler(source)).toBe(`/**
 * Click an element
 * @param {string} selector
 */
`)
    })

    it('returns the full string when there is no default export', () => {
        expect(compiler('const x = 1')).toBe('const x = 1')
    })
})
