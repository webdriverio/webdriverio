import { describe, it, expect } from 'vitest'

import { diffLines, unifiedDiff } from '../src/diff.js'

describe('diffLines', () => {
    it('keeps common lines and marks removals before additions', () => {
        expect(diffLines(['a', 'b', 'c'], ['a', 'x', 'c']).map((op) => op.kind + op.line)).toEqual([' a', '-b', '+x', ' c'])
    })

    it('handles empty inputs', () => {
        expect(diffLines([], ['a']).map((op) => op.kind + op.line)).toEqual(['+a'])
        expect(diffLines(['a'], []).map((op) => op.kind + op.line)).toEqual(['-a'])
    })

    it('diffs large inputs with a small change quickly', () => {
        const a = Array.from({ length: 20_000 }, (_, i) => `line ${i}`)
        const b = [...a.slice(0, 10_000), 'new', ...a.slice(10_000)]
        const start = performance.now()
        const ops = diffLines(a, b)
        expect(performance.now() - start).toBeLessThan(500)
        expect(ops.filter((op) => op.kind !== ' ')).toEqual([{ kind: '+', line: 'new', a: 10_000, b: 10_000 }])
    })
})

describe('unifiedDiff', () => {
    it('returns an empty string for equal texts', () => {
        expect(unifiedDiff('a\nb', 'a\nb')).toBe('')
    })

    it('prints hunks with two context lines', () => {
        const before = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].join('\n')
        const after = ['1', '2', '3', '4', 'five', '6', '7', '8', '9', '10', '11'].join('\n')
        expect(unifiedDiff(before, after)).toBe([
            '@@ -3,5 +3,5 @@',
            ' 3',
            ' 4',
            '-5',
            '+five',
            ' 6',
            ' 7',
            '@@ -9,2 +9,3 @@',
            ' 9',
            ' 10',
            '+11'
        ].join('\n'))
    })

    it('merges hunks whose context overlaps', () => {
        expect(unifiedDiff('a\nb\nc\nd', 'A\nb\nc\nD')).toBe('@@ -1,4 +1,4 @@\n-a\n+A\n b\n c\n-d\n+D')
    })

    it('shows pure additions', () => {
        expect(unifiedDiff('- main\n  - button "Say hello"', '- main\n  - button "Say hello"\n  - status "Hello!"'))
            .toBe('@@ -1,2 +1,3 @@\n - main\n   - button "Say hello"\n+  - status "Hello!"')
    })
})
