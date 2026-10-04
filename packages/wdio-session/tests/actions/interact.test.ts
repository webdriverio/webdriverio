import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it, expect } from 'vitest'

import { click, fill, navigate, normalizeUrl, parseKeys, type, upload } from '../../src/actions/interact.js'
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
                ? { x: 10, y: 20, hit: true }
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

    it('does not click when something else is at the element\'s center', async () => {
        const actions: string[] = []
        const element = {
            setValue: async () => {
                throw new Error('element not interactable')
            },
            execute: async () => ({ x: 10, y: 20, hit: false })
        }
        const session = refSession(element, { action: () => { actions.push('action'); return {} }, keys: async () => actions.push('keys') })
        await expect(fill(session, { target: 'e2', text: 'x', $cwd: '/' })).rejects.toThrow('element not interactable')
        expect(actions).toEqual([])
    })

    it('rethrows other errors', async () => {
        const element = { setValue: async () => { throw new Error('stale element reference') } }
        await expect(fill(refSession(element), { target: 'e2', text: 'x', $cwd: '/' })).rejects.toThrow('stale element reference')
    })
})

/** a session whose page is at `urls[0]` before and `urls[1]` after the action */
function clickSession (element: Record<string, unknown>, browser: Record<string, unknown> = {}, urls = ['https://a.test/', 'https://a.test/']) {
    let calls = 0
    const session = refSession(element, browser) as unknown as Record<string, unknown>
    session.currentUrl = async () => urls[Math.min(calls++, urls.length - 1)]
    return session as unknown as Session
}

describe('click', () => {
    it('clicks an element that is free', async () => {
        const clicked: string[] = []
        const element = { execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => clicked.push('click') }
        const result = await click(clickSession(element), { target: 'e2', $cwd: '/' })
        expect(clicked).toEqual(['click'])
        expect(result.text).toBe('Clicked e2 (textbox "Name")')
    })

    it('fails at once for a hidden element, naming where a link goes', async () => {
        const element = {
            execute: async () => ({ state: 'hidden', x: 0, y: 0, href: 'https://a.test/nutrition' }),
            click: async () => { throw new Error('should not click') }
        }
        await expect(click(clickSession(element), { target: 'e2', $cwd: '/' }))
            .rejects.toThrow('e2 (textbox "Name") is not visible on the page; it links to https://a.test/nutrition.')
    })

    it('fails at once for a covered element, naming what covers it', async () => {
        const element = {
            execute: async () => ({ state: 'covered', x: 5, y: 5, cover: 'dialog "Cookie settings"' }),
            click: async () => { throw new Error('should not click') }
        }
        await expect(click(clickSession(element), { target: 'e2', $cwd: '/' }))
            .rejects.toThrow('e2 (textbox "Name") is covered by dialog "Cookie settings".')
    })

    it('clicks the label of a hidden radio button or checkbox', async () => {
        const actions: string[] = []
        const pointer = {
            move: (opts: { x: number, y: number }) => (actions.push(`move ${opts.x},${opts.y}`), pointer),
            down: () => (actions.push('down'), pointer),
            up: () => (actions.push('up'), pointer),
            perform: async () => actions.push('perform')
        }
        const element = {
            execute: async () => ({ state: 'label', x: 40, y: 60 }),
            click: async () => { throw new Error('should not click the hidden input') }
        }
        await click(clickSession(element, { action: () => pointer }), { target: 'e2', $cwd: '/' })
        expect(actions).toEqual(['move 40,60', 'down', 'up', 'perform'])
    })

    it('reports a page that is still loading instead of failing', async () => {
        const element = {
            execute: async () => ({ state: 'ok', x: 5, y: 5 }),
            click: async () => {
                const err = new Error('timeout: Timed out receiving message from renderer: 19.4')
                err.name = 'timeout'
                throw err
            }
        }
        const result = await click(clickSession(element, {}, ['https://a.test/', 'https://a.test/next']), { target: 'e2', $cwd: '/' })
        expect(result.text).toBe('Clicked e2 (textbox "Name")\nNavigated to https://a.test/next\nThe page is still loading; what is shown below is what has loaded so far.')
    })

    it('still fails for other errors', async () => {
        const element = { execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => { throw new Error('stale element reference') } }
        await expect(click(clickSession(element), { target: 'e2', $cwd: '/' })).rejects.toThrow('stale element reference')
    })
})

describe('navigate', () => {
    it('reports a page that is still loading instead of failing', async () => {
        const session = clickSession({}, {
            url: async () => {
                const err = new Error('timeout: Timed out receiving message from renderer')
                err.name = 'timeout'
                throw err
            },
            getTitle: async () => 'Shop'
        }, ['https://shop.test/'])
        session.get = () => undefined
        const result = await navigate(session, { url: 'https://shop.test/', $cwd: '/' })
        expect(result.text).toBe('Navigated to https://shop.test/ — Shop\nThe page is still loading; what is shown below is what has loaded so far.')
    })
})
