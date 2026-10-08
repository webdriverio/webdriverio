/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fill, select } from '../../src/actions/interact.js'
import { cliCmd } from '../../src/hints.js'
import type { Session } from '../../src/session.js'

/** `fill` and `select` run on a jsdom page whose layout is faked: the cover is whatever sits at every point */
function setup (cover: string, field = '<input id="target">') {
    document.body.innerHTML = `${field}${cover}`
    const coverNode = document.getElementById('cover')!
    const target = document.getElementById('target')!
    document.elementFromPoint = () => coverNode
    HTMLElement.prototype.scrollIntoView = () => {}
    Element.prototype.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: 10, bottom: 10, width: 10, height: 10 }) as DOMRect
    const element = {
        execute: async (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => fn(target, ...args),
        setValue: vi.fn(async () => {}),
        selectByVisibleText: vi.fn(async () => {}),
        selectByIndex: vi.fn(async () => {})
    }
    const session = {
        cmd: cliCmd,
        isWeb: true,
        currentUrl: async () => 'https://a.test/',
        browser: {},
        refs: {
            resolve: async () => element,
            stableSelector: async () => 'input',
            get: () => ({ id: 'e2', kind: 'web', role: 'textbox', name: 'Name', candidates: [], generation: 1 })
        }
    } as unknown as Session
    return { element, session }
}

function sizeCover (width: number, height: number) {
    document.getElementById('cover')!.getBoundingClientRect = () => ({ x: 0, y: 0, left: 0, top: 0, right: width, bottom: height, width, height }) as DOMRect
}

describe('fill and select under a cover', () => {
    beforeEach(() => {
        Object.defineProperty(HTMLElement.prototype, 'innerText', { configurable: true, get () { return this.textContent } })
    })

    it('fill stops under a modal dialog and names its close control', async () => {
        const { element, session } = setup('<div id="cover" role="dialog" aria-modal="true"><button>Close</button></div>')
        const err = await fill(session, { target: 'e2', text: 'Ada', $cwd: '/' }).catch((e) => e)
        expect(err.message).toContain('is covered by dialog')
        expect(err.hint).toBe('Close it first: button "Close".')
        expect(element.setValue).not.toHaveBeenCalled()
    })

    it('fill stops under a full-screen fixed layer without a role', async () => {
        const { element, session } = setup('<div id="cover" style="position: fixed">Sale</div>')
        sizeCover(innerWidth, innerHeight)
        const err = await fill(session, { target: 'e2', text: 'Ada', $cwd: '/' }).catch((e) => e)
        expect(err.message).toContain('is covered by')
        expect(err.hint).toBe('Close or dismiss what is on top first (a cookie banner, dialog or popup), or scroll so the element is free.')
        expect(element.setValue).not.toHaveBeenCalled()
    })

    it('fill goes on under a fixed bar that is not full-screen', async () => {
        const { element, session } = setup('<div id="cover" style="position: fixed">We use cookies</div>')
        sizeCover(innerWidth, 60)
        await fill(session, { target: 'e2', text: 'Ada', $cwd: '/' })
        expect(element.setValue).toHaveBeenCalledWith('Ada')
    })

    it('fill goes on under a cover that is not an overlay', async () => {
        const { element, session } = setup('<span id="cover">hi</span>')
        await fill(session, { target: 'e2', text: 'Ada', $cwd: '/' })
        expect(element.setValue).toHaveBeenCalledWith('Ada')
    })

    it('fill goes on when the cover is the input label', async () => {
        const { element, session } = setup('<label id="cover" for="target">Name</label>')
        await fill(session, { target: 'e2', text: 'Ada', $cwd: '/' })
        expect(element.setValue).toHaveBeenCalledWith('Ada')
    })

    it('select stops under a modal dialog before choosing', async () => {
        const { element, session } = setup('<div id="cover" role="dialog" aria-modal="true"><button>Close</button></div>', '<select id="target"><option>Red</option></select>')
        const err = await select(session, { target: 'e2', value: 'Red', $cwd: '/' }).catch((e) => e)
        expect(err.message).toContain('is covered by dialog')
        expect(element.selectByVisibleText).not.toHaveBeenCalled()
    })

    it('select goes on under a cover that is not an overlay', async () => {
        const { element, session } = setup('<span id="cover">hi</span>', '<select id="target"><option>Red</option></select>')
        await select(session, { target: 'e2', value: '0', by: 'index', $cwd: '/' })
        expect(element.selectByIndex).toHaveBeenCalledWith(0)
    })

    it('select goes on under a fixed bar that is not full-screen', async () => {
        const { element, session } = setup('<div id="cover" style="position: fixed">We use cookies</div>', '<select id="target"><option>Red</option></select>')
        sizeCover(innerWidth, 60)
        await select(session, { target: 'e2', value: '0', by: 'index', $cwd: '/' })
        expect(element.selectByIndex).toHaveBeenCalledWith(0)
    })
})
