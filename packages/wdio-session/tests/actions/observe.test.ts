import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { inViewport, matchLines, pngSize, readableUrl, stem } from '../../src/actions/observe.js'

const PNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
)

describe('pngSize', () => {
    it('reads a PNG and ignores other files', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-png-'))
        const png = path.join(dir, 'shot.png')
        const text = path.join(dir, 'note.txt')
        fs.writeFileSync(png, PNG)
        fs.writeFileSync(text, 'not a png')
        try {
            expect(pngSize(png)).toEqual({ width: 1, height: 1 })
            expect(pngSize(text)).toBeUndefined()
        } finally {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('reads dimensions from the header of a large PNG', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-png-'))
        const png = path.join(dir, 'shot.png')
        fs.writeFileSync(png, Buffer.concat([PNG, Buffer.alloc(1024 * 1024)]))
        const spy = vi.spyOn(fs, 'readFileSync')
        try {
            expect(pngSize(png)).toEqual({ width: 1, height: 1 })
            expect(spy).not.toHaveBeenCalled()
        } finally {
            spy.mockRestore()
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })
})

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

describe('inViewport', () => {
    it('keeps elements overlapping the viewport, with their text', () => {
        const tree = {
            role: 'document',
            children: [
                { role: 'heading', name: 'Above', box: [0, -400, 800, 40], children: [{ role: 'text', name: 'Above' }] },
                { role: 'paragraph', box: [0, 100, 800, 60], children: [{ role: 'text', name: 'Visible text' }] },
                { role: 'button', name: 'Buy', ref: 'e4', box: [10, 700, 80, 30] },
                { role: 'link', name: 'Below', ref: 'e5', box: [0, 1200, 100, 20] }
            ]
        }
        const view = inViewport(tree, 1280, 800)!
        expect(view.children!.map((c) => c.role)).toEqual(['paragraph', 'button'])
        expect(view.children![0].children).toEqual([{ role: 'text', name: 'Visible text' }])
    })

    it('leaves out text directly in a container taller than the viewport', () => {
        const tree = { role: 'main', box: [0, -2000, 800, 4000], children: [{ role: 'text', name: 'Somewhere in main' }, { role: 'button', name: 'Buy', ref: 'e4', box: [0, 100, 80, 30] }] }
        expect(inViewport(tree, 1280, 800)!.children!.map((c) => c.role)).toEqual(['button'])
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
