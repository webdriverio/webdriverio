import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'

import { fill, normalizeUrl, parseKeys, type, upload } from '../../src/actions/interact.js'
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

/** a session with one ref, e2, that resolves to `element` */
function refSession (element: Record<string, unknown>, browser: Record<string, unknown> = {}) {
    return {
        browser,
        refs: {
            resolve: async () => element,
            stableSelector: async () => 'role/textbox[name="Name"]',
            get: () => ({ id: 'e2', kind: 'web', role: 'textbox', name: 'Name', candidates: [], generation: 1 })
        }
    } as unknown as Session
}

describe('type', () => {
    it('types into the element when the text starts with a ref', async () => {
        const added: string[] = []
        const keys: string[] = []
        const session = refSession({ addValue: async (v: string) => added.push(v) }, { keys: async (v: string) => keys.push(v) })
        const result = await type(session, { text: 'e2 Ada Lovelace', $cwd: '/' })
        expect(added).toEqual(['Ada Lovelace'])
        expect(keys).toEqual([])
        expect(result.code).toBe('await $(\'role/textbox[name="Name"]\').addValue(\'Ada Lovelace\')')
    })

    it('types into the focused element otherwise', async () => {
        const keys: string[] = []
        const session = refSession({}, { keys: async (v: string) => keys.push(v) })
        await type(session, { text: 'hello world', $cwd: '/' })
        await type(session, { text: 'e2', $cwd: '/' })
        expect(keys).toEqual(['hello world', 'e2'])
    })
})

describe('fill', () => {
    it('clicks the element and types when the driver cannot reach it', async () => {
        const actions: string[] = []
        const keys: string[] = []
        const element = {
            setValue: async () => {
                const err = new Error('Element <input> did not become interactable')
                err.name = 'webdriverio(middleware): element did not become interactable'
                throw err
            },
            execute: async (fn: (el: unknown) => unknown) => fn.toString().includes('getBoundingClientRect')
                ? { x: 10, y: 20, visible: true }
                : actions.push('select')
        }
        const pointer = {
            move: (opts: { x: number, y: number }) => {
                actions.push(`move ${opts.x},${opts.y}`)
                return pointer
            },
            down: () => (actions.push('down'), pointer),
            up: () => (actions.push('up'), pointer),
            perform: async () => actions.push('perform')
        }
        const session = refSession(element, { action: () => pointer, keys: async (v: string) => keys.push(v) })
        await fill(session, { target: 'e2', text: 'SAVE20', $cwd: '/' })
        expect(actions).toEqual(['move 10,20', 'down', 'up', 'perform', 'select'])
        expect(keys).toEqual(['SAVE20'])
    })

    it('rethrows other errors', async () => {
        const element = { setValue: async () => { throw new Error('stale element reference') } }
        await expect(fill(refSession(element), { target: 'e2', text: 'x', $cwd: '/' })).rejects.toThrow('stale element reference')
    })
})
