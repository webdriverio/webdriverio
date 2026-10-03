import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { describe, expect, it, vi } from 'vitest'

import { matchLines, pngSize, readableUrl } from '../../src/actions/observe.js'

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
