import { describe, expect, it } from 'vitest'

import { headingAbove, matchLines, readableUrl, stem } from '../src/find.js'

describe('readableUrl', () => {
    it('reads underscores, plus signs and escapes as text', () => {
        expect(readableUrl('https://en.wikipedia.org/wiki/World_Wide_Web')).toBe('https://en.wikipedia.org/wiki/World Wide Web')
        expect(readableUrl('/search?q=web+app&x=%C3%A9t%C3%A9')).toBe('/search?q=web app&x=été')
        expect(readableUrl('/broken%E0%A4%A')).toBe('/broken%E0%A4%A')
    })
})

describe('matchLines', () => {
    const snapshot = [
        '- main',
        '  - link "web technologies" [ref=e3] url=https://en.wikipedia.org/wiki/World_Wide_Web',
        '  - link "World Wide Web Consortium" [ref=e4] url=https://en.wikipedia.org/wiki/W3C',
        '  - text "The World Wide Web is an information system"'
    ]
    const has = (needle: string) => (line: string) => line.toLowerCase().includes(needle.toLowerCase())

    it('matches link targets and prints the URL only where it made the match', () => {
        const { lines, shown, matches } = matchLines(snapshot, has('World Wide Web'))
        expect(matches).toEqual([1, 2, 3])
        expect(shown[1]).toBe(snapshot[1])
        expect(shown[2]).toBe('  - link "World Wide Web Consortium" [ref=e4]')
        expect(lines.some((line) => line.includes('url='))).toBe(false)
    })

    it('does not match on URLs when the text matches nothing there', () => {
        expect(matchLines(snapshot, has('Consortium')).matches).toEqual([2])
        expect(matchLines(snapshot, has('Tim Berners-Lee')).matches).toEqual([])
    })
})

describe('headingAbove', () => {
    const lines = [
        '- main',
        '  - heading "Pricing" [level=2]',
        '  - text "intro"',
        '  - listitem',
        '    - text "Pro"',
        '    - button "Buy" [ref=e1]',
        '  - heading "FAQ" [level=2]'
    ]

    it('finds the nearest heading above a block without one', () => {
        expect(headingAbove(lines, 3, 5)).toBe(1)
    })

    it('leaves a block that has its own heading, or no heading above it', () => {
        expect(headingAbove(lines, 1, 2)).toBeUndefined()
        expect(headingAbove(lines, 0, 0)).toBeUndefined()
    })
})

describe('stem', () => {
    it.each([
        ['Give', 'giv'],
        ['giving', 'giv'],
        ['donate', 'donat'],
        ['donations', 'don'],
        ['shipping', 'shipp'],
        ['careers', 'care'],
        ['cart', 'cart'],
        ['use', 'use']
    ])('%s → %s', (word, expected) => {
        expect(stem(word)).toBe(expected)
    })
})
