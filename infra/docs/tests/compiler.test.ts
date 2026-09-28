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

    it('slices off the last character when there is no default export', () => {
        /**
         * `indexOf` is -1, so `slice(0, -1)` drops the final character.
         * Command files always contain `export default function`, so this
         * is only hit by unexpected input.
         */
        expect(compiler('const x = 1')).toBe('const x = ')
    })
})
