import { describe, expect, it, vi } from 'vitest'
import { RefRegistry } from '@wdio/snapshot'

import { takeSnapshot } from '../../src/actions/observe.js'
import type { Session } from '../../src/session.js'

const TOP_VIEWPORT = [1000, 600]
/** where the iframe's content starts on the page, then the viewport */
const FRAME_ORIGIN = [0, 500, ...TOP_VIEWPORT]

vi.mock('../../src/actions/contexts.js', () => ({
    currentPage: async () => ({ contextId: 'top' }),
    frameBySrc: async (_session: unknown, _owner: unknown, element: { child: unknown }) => element.child,
    frameContext: async () => undefined
}))

vi.mock('../../src/settle.js', () => ({ settleFreshPage: async () => undefined }))

const frameTree = {
    role: 'document',
    children: [
        { role: 'button', name: 'Visible', ref: 'e2', interactive: true, box: [10, 10, 50, 20] },
        { role: 'button', name: 'Below', ref: 'e3', interactive: true, box: [10, 200, 50, 20] },
        { role: 'text', name: 'Loose text' },
        {
            role: 'group',
            name: 'Wrapper',
            ref: 'e4',
            box: [0, 300, 100, 100],
            children: [
                { role: 'button', name: 'Peek', ref: 'e5', interactive: true, box: [10, -150, 50, 20] },
                { role: 'button', name: 'Hidden inside', ref: 'e6', interactive: true, box: [10, 150, 50, 20] }
            ]
        },
        {
            role: 'group',
            name: 'Contents wrapper',
            box: [0, 0, 0, 0],
            children: [
                { role: 'text', name: 'Wrapped visible text' },
                { role: 'button', name: 'Inside wrapper', ref: 'e7', interactive: true, box: [10, -100, 50, 20] }
            ]
        },
        { role: 'button', name: 'Zero off-screen', ref: 'e8', interactive: true, box: [10, 150, 0, 0] },
        { role: 'group', name: 'Gone', box: [0, 400, 100, 100], children: [{ role: 'text', name: 'Gone text' }] }
    ]
}

function fakeSession () {
    const child = { execute: async () => ({ tree: structuredClone(frameTree), refs: [], counter: 7 }) }
    const top = {
        role: 'document',
        name: 'Shop',
        children: [{ role: 'iframe', name: 'Pay', ref: 'e1', interactive: true, children: [] }]
    }
    const iframe = { child }
    const refs = new RefRegistry()
    refs.resolve = async () => iframe as never
    return {
        isWeb: true,
        isBidi: true,
        applies: ['W'],
        refs,
        settledKey: undefined,
        frameHint: undefined,
        get: (key: string) => key === 'classicScripts' ? false : undefined,
        currentUrl: async () => 'https://shop.test/',
        browser: {
            execute: async (_fn: unknown, ...args: unknown[]) => {
                if (typeof args[0] === 'number') {
                    return undefined
                }
                if (!args.length) {
                    return ['https://shop.test/', 1]
                }
                return typeof args[0] === 'string' ? { tree: top, refs: [], counter: 1 } : FRAME_ORIGIN
            }
        }
    } as unknown as Session
}

describe('inlined frames in a viewport snapshot', () => {
    it('drops what is outside the top-level viewport, keeping wrappers of what is inside', async () => {
        const { text } = await takeSnapshot(fakeSession(), { viewport: true })
        expect(text).toContain('Visible')
        expect(text).toContain('Peek')
        expect(text).toContain('Wrapper')
        expect(text).toContain('Loose text')
        expect(text).toContain('Wrapped visible text')
        expect(text).not.toContain('Below')
        expect(text).not.toContain('Hidden inside')
        expect(text).not.toContain('Zero off-screen')
        expect(text).not.toContain('Gone')
        expect(text).not.toContain('[box=')
    })

    it('keeps the whole frame without --viewport', async () => {
        const { text } = await takeSnapshot(fakeSession(), {})
        expect(text).toContain('Below')
        expect(text).toContain('Hidden inside')
        expect(text).toContain('Gone text')
    })
})
