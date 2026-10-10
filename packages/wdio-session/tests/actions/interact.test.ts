import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, it, expect, vi } from 'vitest'

import { click, fill, navigate, normalizeUrl, parseKeys, press, type, upload } from '../../src/actions/interact.js'
import { quote } from '../../src/quote.js'
import { cliCmd } from '../../src/hints.js'
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
        cmd: cliCmd,
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
        cmd: cliCmd,
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
            execute: async (fn: (el: unknown) => unknown) => fn.toString().includes('aria-valuenow')
                ? { kind: 'text' }
                : fn.toString().includes('getBoundingClientRect')
                    ? { x: 10, y: 20, originX: 8, originY: 25, hit: true }
                    : actions.push('select')
        }
        const pointer = {
            move: (opts: { x: number, y: number, origin: unknown }) => {
                actions.push(`move ${opts.x},${opts.y} ${opts.origin === element ? 'element' : 'other'}`)
                return pointer
            },
            down: () => (actions.push('down'), pointer),
            up: () => (actions.push('up'), pointer),
            perform: async () => actions.push('perform')
        }
        const session = refSession(element, { action: () => pointer, keys: async (v: string) => keys.push(v) })
        await fill(session, { target: 'e2', text: 'SAVE20', $cwd: '/' })
        expect(actions).toEqual(['move 2,-5 element', 'down', 'up', 'perform', 'select'])
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

describe('fill on an element that is not editable', () => {
    /** the page-side answer for a wrapper: `editable: false` plus what was found in or around it */
    const wrapper = (found: Record<string, unknown>) => ({ kind: 'text', editable: false, ...found })
    const invalidState = () => {
        const err = new Error('invalid element state: Element must be user-editable in order to clear it.')
        err.name = 'invalid element state'
        return err
    }

    it('fills the single editable field inside and says so', async () => {
        const filled: string[] = []
        const inner = { setValue: async (v: string) => { filled.push(v) } }
        const outer = {
            setValue: async () => { throw invalidState() },
            execute: async () => wrapper({ count: 1, via: 'inside', selector: 'input', desc: 'search input' }),
            $: (selector: string) => ({ getElement: async () => (filled.push(`$ ${selector}`), inner) })
        }
        const result = await fill(refSession(outer), { target: 'e2', text: 'shoes', $cwd: '/' })
        expect(filled).toEqual(['$ input', 'shoes'])
        expect(result.text).toBe('Filled the search input inside e2 (textbox "Name")')
        expect(result.code).toBe('await $(\'role/textbox[name="Name"]\').$(\'input\').setValue(\'shoes\')')
        expect(result.history).toBe(result.code)
    })

    it('throws NOT_EDITABLE with a hint when the element holds several fields', async () => {
        const outer = { setValue: async () => { throw invalidState() }, execute: async () => wrapper({ count: 2 }) }
        const err = await fill(refSession(outer), { target: 'e2', text: 'x', $cwd: '/' }).catch((e) => e)
        expect(err).toMatchObject({ name: 'SessionError', code: 'NOT_EDITABLE' })
        expect(err.message).toContain('e2 (textbox "Name")')
        expect(err.message).toContain('2 editable fields')
        expect(err.hint).toContain('wdio session snapshot --scope e2')
    })

    it('throws NOT_EDITABLE when there is no field at all', async () => {
        const outer = { setValue: async () => { throw invalidState() }, execute: async () => wrapper({ count: 0 }) }
        const err = await fill(refSession(outer), { target: 'e2', text: 'x', $cwd: '/' }).catch((e) => e)
        expect(err).toMatchObject({ name: 'SessionError', code: 'NOT_EDITABLE' })
        expect(err.message).toContain('no editable field')
        expect(err.hint).toContain('wdio session snapshot --scope e2')
    })

    it('maps a driver "invalid element state" to NOT_EDITABLE and keeps it as the cause', async () => {
        const original = invalidState()
        const outer = { setValue: async () => { throw original }, execute: async () => ({ kind: 'text', editable: true }) }
        const err = await fill(refSession(outer), { target: 'e2', text: 'x', $cwd: '/' }).catch((e) => e)
        expect(err).toMatchObject({ name: 'SessionError', code: 'NOT_EDITABLE' })
        expect(err.cause).toBe(original)
        expect(err.hint).toContain('wdio session snapshot --scope e2')
    })

    it('leaves an editable input as it was', async () => {
        const filled: string[] = []
        const outer = {
            setValue: async (v: string) => { filled.push(v) },
            execute: async () => ({ kind: 'text', editable: true }),
            $: () => { throw new Error('must not look inside an editable input') }
        }
        const result = await fill(refSession(outer), { target: 'e2', text: 'Ada', $cwd: '/' })
        expect(filled).toEqual(['Ada'])
        expect(result.text).toBe('Filled e2 (textbox "Name")')
        expect(result.code).toBe('await $(\'role/textbox[name="Name"]\').setValue(\'Ada\')')
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

    it('fails at once for a hidden element, without leaking where a link goes', async () => {
        const element = {
            execute: async () => ({ state: 'hidden', x: 0, y: 0, href: 'https://a.test/nutrition' }),
            click: async () => { throw new Error('should not click') }
        }
        const err = await click(clickSession(element), { target: 'e2', $cwd: '/' }).catch((e) => e)
        expect(err.message).toBe('e2 (textbox "Name") is not visible on the page.')
        expect(JSON.stringify([err.message, err.hint])).not.toContain('https://a.test/nutrition')
        expect(err.hint).toContain('take a new snapshot')
        expect(err.hint).not.toContain('navigate')
    })

    it('names the control that dismisses the dialog covering an element', async () => {
        const element = {
            execute: async () => ({ state: 'covered', x: 5, y: 5, cover: 'dialog "Cookie settings"', dismiss: 'button "Accept all"' }),
            click: async () => { throw new Error('should not click') }
        }
        const err = await click(clickSession(element), { target: 'e2', $cwd: '/' }).catch((e) => e)
        expect(err.hint).toBe('Close it first: button "Accept all".')
    })

    it('fails at once for a covered element, naming what covers it', async () => {
        const element = {
            execute: async () => ({ state: 'covered', x: 5, y: 5, cover: 'dialog "Cookie settings"' }),
            click: async () => { throw new Error('should not click') }
        }
        await expect(click(clickSession(element), { target: 'e2', $cwd: '/' }))
            .rejects.toThrow('e2 (textbox "Name") is covered by dialog "Cookie settings".')
    })

    describe('covered by a sticky header', () => {
        const pointerFor = (actions: string[], element: unknown) => {
            const pointer = {
                move: (opts: { x: number, y: number, origin: unknown }) => (actions.push(`move ${opts.x},${opts.y} ${opts.origin === element ? 'element' : 'other'}`), pointer),
                down: () => pointer,
                up: () => pointer,
                perform: async () => actions.push('perform')
            }
            return pointer
        }

        it('scrolls to the middle once and clicks where the element is free', async () => {
            const actions: string[] = []
            const instant: unknown[] = []
            const element = {
                execute: async (_fn: unknown, arg?: unknown) => {
                    instant.push(arg)
                    return arg
                        ? { state: 'ok', x: 30, y: 300, originX: 30, originY: 300 }
                        : { state: 'covered', x: 30, y: 10, originX: 30, originY: 10, cover: 'nav "Shady Meadows"', sticky: true }
                },
                click: async () => { throw new Error('should click with the pointer') }
            }
            await click(clickSession(element, { action: () => pointerFor(actions, element) }), { target: 'e2', $cwd: '/' })
            expect(instant).toEqual([false, true])
            expect(actions).toEqual(['move 0,0 element', 'perform'])
        })

        it('clicks the free lower half of an element that is partly under the header', async () => {
            const actions: string[] = []
            const element = {
                execute: async () => ({ state: 'ok', x: 30, y: 90, originX: 30, originY: 70.5, offCenter: true }),
                click: async () => { throw new Error('should click with the pointer') }
            }
            await click(clickSession(element, { action: () => pointerFor(actions, element) }), { target: 'e2', $cwd: '/' })
            expect(actions).toEqual(['move 0,20 element', 'perform'])
        })

        it('keeps the error when no point of the element is free', async () => {
            const element = {
                execute: async () => ({ state: 'covered', x: 30, y: 40, cover: 'nav "Shady Meadows"', sticky: true }),
                click: async () => { throw new Error('should not click') }
            }
            await expect(click(clickSession(element, { action: () => { throw new Error('should not use the pointer') } }), { target: 'e2', $cwd: '/' }))
                .rejects.toThrow('e2 (textbox "Name") is covered by nav "Shady Meadows".')
        })

        it('keeps the error for a dialog', async () => {
            let checks = 0
            const element = {
                execute: async () => (checks++, { state: 'covered', x: 5, y: 5, cover: 'dialog "Cookie settings"', sticky: false }),
                click: async () => { throw new Error('should not click') }
            }
            await expect(click(clickSession(element), { target: 'e2', $cwd: '/' }))
                .rejects.toThrow('e2 (textbox "Name") is covered by dialog "Cookie settings".')
            expect(checks).toBe(1)
        })

        it('keeps the error when it is still covered after the scroll', async () => {
            let checks = 0
            const element = {
                execute: async () => (checks++, { state: 'covered', x: 5, y: 5, cover: 'nav "Shady Meadows"', sticky: true }),
                click: async () => { throw new Error('should not click') }
            }
            await expect(click(clickSession(element, { action: () => { throw new Error('should not use the pointer') } }), { target: 'e2', $cwd: '/' }))
                .rejects.toThrow('e2 (textbox "Name") is covered by nav "Shady Meadows".')
            expect(checks).toBe(2)
        })
    })

    it('clicks the label of a hidden radio button or checkbox', async () => {
        const actions: string[] = []
        const labelElement = {}
        const pointer = {
            move: (opts: { x: number, y: number, origin: unknown }) => (actions.push(`move ${opts.x},${opts.y} ${opts.origin === labelElement ? 'label' : 'other'}`), pointer),
            down: () => (actions.push('down'), pointer),
            up: () => (actions.push('up'), pointer),
            perform: async () => actions.push('perform')
        }
        const labelRef = { 'element-6066-11e4-a52e-4f735466cecf': 'label-id' }
        const element = {
            execute: async () => ({ state: 'label', x: 40, y: 60, originX: 38, originY: 60, label: labelRef }),
            $: async (ref: unknown) => ref === labelRef ? labelElement : undefined,
            click: async () => { throw new Error('should not click the hidden input') }
        }
        await click(clickSession(element, { action: () => pointer }), { target: 'e2', $cwd: '/' })
        expect(actions).toEqual(['move 2,0 label', 'down', 'up', 'perform'])
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

    it('does not click a covered label of a hidden radio button', async () => {
        const element = {
            execute: async () => ({ state: 'covered', x: 40, y: 60, cover: 'dialog "Cookie settings"' }),
            click: async () => { throw new Error('should not click') }
        }
        await expect(click(clickSession(element, { action: () => { throw new Error('should not use the pointer') } }), { target: 'e2', $cwd: '/' }))
            .rejects.toThrow('is covered by dialog "Cookie settings".')
    })

    it('does not pointer-click after an intercepted click when the second check finds an overlay', async () => {
        let checks = 0
        const element = {
            execute: async () => ++checks === 1 ? { state: 'ok', x: 5, y: 5 } : { state: 'covered', x: 5, y: 5, cover: 'div' },
            click: async () => {
                const err = new Error('element click intercepted: Other element would receive the click')
                err.name = 'element click intercepted'
                throw err
            }
        }
        await expect(click(clickSession(element, { action: () => { throw new Error('should not use the pointer') } }), { target: 'e2', $cwd: '/' }))
            .rejects.toThrow('is covered by div.')
    })

    it('still fails for other errors', async () => {
        const element = { execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => { throw new Error('unknown error: chrome not reachable') } }
        await expect(click(clickSession(element), { target: 'e2', $cwd: '/' })).rejects.toThrow('chrome not reachable')
    })

    it('clicks the element that replaced the ref\'s, found by its selector', async () => {
        const replaced = { execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => { throw new Error('stale element reference: stale element not found in the current frame') } }
        const clicked: string[] = []
        const replacement = { elementId: 'new-1', execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => clicked.push('new') }
        const browser = {
            $$: () => ({ getElements: async () => [replacement] }),
            $: () => ({ getElement: async () => replacement })
        }
        const session = clickSession(replaced, browser)
        ;(session.refs as unknown as { get: () => unknown }).get = () => ({ id: 'e2', kind: 'web', role: 'textbox', name: 'Name', candidates: ['#name'], generation: 1 })
        const result = await click(session, { target: 'e2', $cwd: '/' })
        expect(clicked).toEqual(['new'])
        expect(result.text).toContain('Clicked e2')
    })

    it('does not find a replaced element again by its position in a list', async () => {
        const replaced = { execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => { throw new Error('stale element reference') } }
        const other = { elementId: 'other-1', execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => { throw new Error('should not click another item') } }
        const browser = { $$: () => ({ getElements: async () => [other] }), $: () => ({ getElement: async () => other }) }
        const session = clickSession(replaced, browser)
        ;(session.refs as unknown as { get: () => unknown }).get = () => ({ id: 'e2', kind: 'web', role: 'textbox', name: 'Name', candidates: ['ul > li:nth-of-type(1)'], generation: 1 })
        await expect(click(session, { target: 'e2', $cwd: '/' })).rejects.toThrow('was replaced by the page while it was clicked')
    })

    it('finds a replaced element again by a name that contains " > "', async () => {
        const replaced = { execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => { throw new Error('stale element reference') } }
        const clicked: string[] = []
        const replacement = { elementId: 'new-2', execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => clicked.push('new') }
        const browser = { $$: () => ({ getElements: async () => [replacement] }), $: () => ({ getElement: async () => replacement }) }
        const session = clickSession(replaced, browser)
        ;(session.refs as unknown as { get: () => unknown }).get = () => ({ id: 'e2', kind: 'web', role: 'link', name: 'Home > Shoes', candidates: ['aria/Home > Shoes', 'a[title="Home > Shoes"]'], generation: 1 })
        await click(session, { target: 'e2', $cwd: '/' })
        expect(clicked).toEqual(['new'])
    })

    it('treats every driver\'s stale element error the same', async () => {
        for (const message of ['is no longer attached to the DOM', 'SharedId "f.1" belongs to different document', 'no such node - The node with the reference f.1 is not known']) {
            const element = { execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => { throw new Error(message) } }
            await expect(click(clickSession(element), { target: 'e2', $cwd: '/' })).rejects.toThrow('was replaced by the page while it was clicked')
        }
    })

    it('says the element was replaced when it is stale twice', async () => {
        const element = { execute: async () => ({ state: 'ok', x: 5, y: 5 }), click: async () => { throw new Error('stale element reference') } }
        await expect(click(clickSession(element), { target: 'e2', $cwd: '/' })).rejects.toThrow('e2 (textbox "Name") was replaced by the page while it was clicked.')
    })
})

describe('click at coordinates', () => {
    it('refuses inside a frame: the coordinates are the page\'s', async () => {
        const session = clickSession({}, { action: () => { throw new Error('should not click') } })
        session.get = (key: string) => key === 'frame' ? 'e5' : undefined
        await expect(click(session, { target: '120,80', $cwd: '/' })).rejects.toThrow('Coordinates are viewport pixels of the page, and the session is inside a frame.')
    })
})

describe('navigate', () => {
    it('does not start a navigation again while the first is still loading', async () => {
        vi.useFakeTimers()
        try {
            let calls = 0
            const session = clickSession({}, {
                url: () => {
                    calls++
                    return new Promise(() => {})
                },
                getTitle: async () => ''
            }, ['https://a.test/'])
            session.get = () => undefined
            const result = navigate(session, { url: 'https://slow.test/', $cwd: '/' })
            await vi.advanceTimersByTimeAsync(25_000)
            expect((await result).text).toContain('The page is still loading')
            expect(calls).toBe(1)
        } finally {
            vi.useRealTimers()
        }
    })

    it('navigates again once when a raced navigation left the page where it was, and reports a refused one', async () => {
        let calls = 0
        const session = clickSession({}, { url: async () => { calls++ }, getTitle: async () => '' }, ['https://a.test/'])
        session.get = () => undefined
        await expect(navigate(session, { url: 'https://refused.test/', $cwd: '/' })).rejects.toThrow('https://refused.test/ did not open; the page is still https://a.test/.')
        expect(calls).toBe(2)
    })

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

describe('press --times', () => {
    it('does not wait forever for a key the driver never finishes', async () => {
        vi.useFakeTimers()
        try {
            const keys = () => new Promise<void>(() => {})
            const result = press(clickSession({}, { keys }), { keys: 'Enter', $cwd: '/' })
            await vi.advanceTimersByTimeAsync(30_000)
            const { text } = await result
            expect(text).toContain('The page is still loading')
            expect(text).toContain('A key press was still pending when the action ended.')
        } finally {
            vi.useRealTimers()
        }
    })

    it('reports a key that fails after the action ended', async () => {
        vi.useFakeTimers()
        try {
            const keys = () => new Promise<void>((_, reject) => setTimeout(() => reject(new Error('session deleted')), 21_000))
            const result = press(clickSession({}, { keys }), { keys: 'Enter', $cwd: '/' })
            const failed = expect(result).rejects.toThrow('session deleted')
            await vi.advanceTimersByTimeAsync(30_000)
            await failed
        } finally {
            vi.useRealTimers()
        }
    })

    it('presses no key after the action reported back', async () => {
        vi.useFakeTimers()
        try {
            let pressed = 0
            // every key press makes the page load for 15 s
            const keys = () => new Promise<void>((resolve) => setTimeout(() => {
                pressed++
                resolve()
            }, 15_000))
            const result = press(clickSession({}, { keys }), { keys: 'Enter', times: 5, $cwd: '/' })
            await vi.advanceTimersByTimeAsync(120_000)
            expect((await result).text).toContain('The page is still loading')
            // the 20 s limit ends the action during the second press: it finishes, no third starts
            expect(pressed).toBe(2)
        } finally {
            vi.useRealTimers()
        }
    })

    it('presses a key the given number of times', async () => {
        const keys: unknown[] = []
        const result = await press(clickSession({}, { keys: async (k: unknown) => keys.push(k) }), { keys: 'ArrowRight', times: 3, $cwd: '/' })
        expect(keys).toEqual(['ArrowRight', 'ArrowRight', 'ArrowRight'])
        expect(result.text).toBe('Pressed ArrowRight 3 times')
        expect(result.code).toBe("for (let i = 0; i < 3; i++) {\n    await browser.keys('ArrowRight')\n}")
    })

    it('rejects counts outside 1 to 100', async () => {
        await expect(press(clickSession({}, { keys: async () => {} }), { keys: 'Tab', times: 101, $cwd: '/' })).rejects.toThrow('--times must be a whole number from 1 to 100.')
    })
})

describe('click at coordinates', () => {
    it('clicks the point and says what was there', async () => {
        const actions: string[] = []
        const pointer = {
            move: (opts: { x: number, y: number }) => (actions.push(`move ${opts.x},${opts.y}`), pointer),
            down: () => (actions.push('down'), pointer),
            up: () => (actions.push('up'), pointer),
            perform: async () => actions.push('perform')
        }
        const session = clickSession({}, { action: () => pointer, execute: async () => 'canvas "Map"' })
        const result = await click(session, { target: '320,480', $cwd: '/' })
        expect(actions).toEqual(['move 320,480', 'down', 'up', 'perform'])
        expect(result.text).toBe('Clicked canvas "Map" at 320,480')
    })

    it('fails when nothing is at the point', async () => {
        const session = clickSession({}, { execute: async () => undefined })
        await expect(click(session, { target: '5000,5000', $cwd: '/' })).rejects.toThrow('Nothing is at 5000,5000.')
    })
})

describe('fill on inputs that are not typed into', () => {
    it('sets a range input with setValue and reports the value it took', async () => {
        const setValue = vi.fn()
        const element = {
            execute: async () => ({ kind: 'direct', type: 'range' }),
            setValue,
            getValue: async () => '65'
        }
        const keys: string[] = []
        const browser = { execute: async () => false, keys: async (key: string) => keys.push(key) }
        const result = await fill(refSession(element, browser), { target: 'e2', text: '67', $cwd: '/' })
        expect(setValue).toHaveBeenCalledWith('67')
        expect(result.text).toBe('Set e2 (textbox "Name") to 65 (it took 65: the nearest allowed value)')
        // one step away and back, so a slider widget sees the keyboard set it
        expect(keys).toEqual(['ArrowRight', 'ArrowLeft'])
    })

    it('records the repair when the steps did not come back to the value', async () => {
        const values = ['40', '39']
        const setValue = vi.fn()
        const element = { execute: async () => ({ kind: 'direct', type: 'range' }), setValue, getValue: async () => values.shift() ?? '40' }
        const browser = { execute: async () => false, keys: async () => {} }
        const result = await fill(refSession(element, browser), { target: 'e2', text: '40', $cwd: '/' })
        expect(setValue).toHaveBeenLastCalledWith('40')
        expect(result.code!.split('\n').at(-1)).toBe('await $(\'role/textbox[name="Name"]\').setValue(\'40\')')
    })

    it('steps a range input at its maximum the other way', async () => {
        const element = { execute: async () => ({ kind: 'direct', type: 'range' }), setValue: async () => {}, getValue: async () => '100' }
        const keys: string[] = []
        const browser = { execute: async () => true, keys: async (key: string) => keys.push(key) }
        await fill(refSession(element, browser), { target: 'e2', text: '100', $cwd: '/' })
        expect(keys).toEqual(['ArrowLeft', 'ArrowRight'])
    })

    it('rejects a date the input does not take', async () => {
        const element = {
            execute: async () => ({ kind: 'direct', type: 'date' }),
            setValue: async () => {},
            getValue: async () => ''
        }
        await expect(fill(refSession(element), { target: 'e2', text: '10/04/2026', $cwd: '/' }))
            .rejects.toThrow('e2 (textbox "Name") did not take "10/04/2026"; it has "".')
    })

    it('moves an ARIA slider with arrow keys until it has the value', async () => {
        let now = 25
        const keys: string[] = []
        const element = {
            execute: async () => ({ kind: 'slider', now, min: 18, max: 85 }),
            getAttribute: async () => String(now)
        }
        const session = refSession(element, {
            keys: async (k: string) => {
                keys.push(k)
                now += k === 'ArrowRight' ? 1 : -1
            },
            execute: async () => {}
        })
        const result = await fill(session, { target: 'e2', text: '30', $cwd: '/' })
        expect(keys).toEqual(Array(5).fill('ArrowRight'))
        expect(result.text).toBe('Set e2 (textbox "Name") to 30')
        expect(result.history).toContain('el.focus()')
        expect(result.history).toContain('for (let i = 0; i < 5; i++) {\n    await browser.keys(\'ArrowRight\')\n}')
    })

    it('reports where an ARIA slider stopped when it cannot reach the value', async () => {
        const element = { execute: async () => ({ kind: 'slider', now: 85, min: 18, max: 85 }), getAttribute: async () => '85' }
        const session = refSession(element, { keys: async () => {}, execute: async () => {} })
        await expect(fill(session, { target: 'e2', text: '99', $cwd: '/' })).rejects.toThrow('e2 (textbox "Name") stopped at 85, not 99.')
    })
})
