import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'

import { normalizeUrl, parseKeys, upload } from '../../src/actions/interact.js'
import { quote } from '../../src/quote.js'
import type { Session } from '../../src/session.js'

describe('parseKeys', () => {
    it('keeps single keys and characters', () => {
        expect(parseKeys('Enter')).toEqual(['Enter'])
        expect(parseKeys('a')).toEqual(['a'])
        expect(parseKeys('+')).toEqual(['+'])
    })

    it('splits combinations and normalizes names', () => {
        expect(parseKeys('Control+a')).toEqual(['Control', 'a'])
        expect(parseKeys('ctrl+shift+Tab')).toEqual(['Control', 'Shift', 'Tab'])
        expect(parseKeys('cmd+Plus')).toEqual(['Command', '+'])
        expect(parseKeys('Shift++')).toEqual(['Shift', '+'])
        expect(parseKeys('esc')).toEqual(['Escape'])
        expect(parseKeys('arrowdown')).toEqual(['ArrowDown'])
        expect(parseKeys('PageUp')).toEqual(['PageUp'])
        expect(parseKeys('Down')).toEqual(['ArrowDown'])
    })

    it('rejects unknown key names', () => {
        expect(() => parseKeys('Control+Foo')).toThrow('Unknown key "Foo".')
        expect(() => parseKeys('')).toThrow('No keys given.')
    })
})

function uploadSession (element: Record<string, unknown>, plan: Record<string, unknown> = {}, isBidi = true) {
    return {
        cwd: '/tmp',
        isBidi,
        plan,
        browser: {
            $: () => ({ getElement: async () => element }),
            uploadFile: async () => {
                throw new Error('uploadFile should not be called')
            }
        }
    } as unknown as Session
}

describe('upload', () => {
    const file = fileURLToPath(import.meta.url)

    it('emits setFiles with the resolved path', async () => {
        const seen: unknown[] = []
        const element = {
            elementId: '1',
            setFiles: async (value: string) => {
                seen.push(value)
            }
        }
        const result = await upload(uploadSession(element), { target: '#file', file, $cwd: '/' })
        expect(seen).toEqual([file])
        expect(result.code).toBe(`await $('#file').setFiles(${quote(file)})`)
        expect(result.history).not.toContain('uploadFile')
        expect(result.history).not.toContain('setValue')
    })

    it('falls back to setValue in a Classic session', async () => {
        const seen: unknown[] = []
        const element = {
            elementId: '1',
            setFiles: async () => {
                throw new Error('setFiles should not be called')
            },
            setValue: async (value: string) => {
                seen.push(value)
            }
        }
        const result = await upload(uploadSession(element, {}, false), { target: '#file', file, $cwd: '/' })
        expect(seen).toEqual([file])
        expect(result.code).toBe(`await $('#file').setValue(${quote(file)})`)
    })

    it('uses setFiles for a remote session', async () => {
        const seen: unknown[] = []
        const element = {
            elementId: '1',
            setFiles: async (value: string) => {
                seen.push(value)
            },
            setValue: async () => {
                throw new Error('setValue should not be called')
            }
        }
        const result = await upload(uploadSession(element, {
            provider: 'browserstack',
            remote: { hostname: 'hub.browserstack.com' }
        }), { target: '#file', file, $cwd: '/' })
        expect(seen).toEqual([path.resolve(file)])
        expect(result.code).toContain('.setFiles(')
        expect(result.code).not.toContain('uploadFile')
    })

    it('rejects a missing file before calling setFiles', async () => {
        const element = {
            elementId: '1',
            setFiles: async () => {
                throw new Error('setFiles should not be called')
            }
        }
        await expect(upload(uploadSession(element), {
            target: '#file',
            file: 'missing.png',
            $cwd: '/tmp/does-not-exist'
        })).rejects.toThrow('does not exist')
    })
})

describe('normalizeUrl', () => {
    it('keeps URLs with a scheme and relative paths', () => {
        expect(normalizeUrl('https://example.com')).toBe('https://example.com')
        expect(normalizeUrl('about:blank')).toBe('about:blank')
        expect(normalizeUrl('data:text/html,hi')).toBe('data:text/html,hi')
        expect(normalizeUrl('/login')).toBe('/login')
        expect(normalizeUrl('./x.html')).toBe('./x.html')
    })

    it('adds a scheme to bare hosts', () => {
        expect(normalizeUrl('example.com')).toBe('https://example.com')
        expect(normalizeUrl('example.com/path?q=1')).toBe('https://example.com/path?q=1')
        expect(normalizeUrl('localhost:8080/form.html')).toBe('http://localhost:8080/form.html')
        expect(normalizeUrl('127.0.0.1:3000')).toBe('http://127.0.0.1:3000')
    })

    it('leaves other strings to baseUrl handling', () => {
        expect(normalizeUrl('login')).toBe('login')
    })
})
