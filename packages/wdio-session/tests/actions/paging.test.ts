import { describe, expect, it, vi } from 'vitest'

import { find, read } from '../../src/actions/observe.js'
import { RefRegistry } from '@wdio/snapshot'
import type { SnapshotNode } from '@wdio/snapshot'
import { cmdWith } from '../../src/hints.js'
import type { Session } from '../../src/session.js'

const refs = [{ id: 'e1', role: 'button', name: 'Add', candidates: [{ kind: 'testid', selector: '[data-testid="add"]' }] }]
const items: SnapshotNode[] = Array.from({ length: 40 }, (_, i) => ({ role: 'paragraph', name: `needle number ${i} ${'x'.repeat(200)}` }))

function findSession () {
    return {
        isWeb: true,
        applies: ['W'],
        cmd: cmdWith(),
        currentUrl: async () => 'https://shop.test/',
        refs: new RefRegistry(),
        get: () => undefined,
        browser: {
            execute: async () => ({ tree: { role: 'document', name: 'Shop', children: structuredClone(items) }, refs, counter: 1 })
        }
    } as unknown as Session
}

describe('find --offset', () => {
    const printed = (text: string) => text.split('\n').filter((line) => /^\d+:/.test(line))

    it('skips matches and says which offset shows the next ones', async () => {
        const first = await find(findSession(), { text: 'needle' })
        const shown = printed(first.text)
        expect(shown.length).toBeLessThan(40)
        const next = /--offset (\d+)/.exec(first.text)![1]
        expect(Number(next)).toBe(shown.length)

        const second = await find(findSession(), { text: 'needle', offset: Number(next) })
        expect(printed(second.text)[0]).toContain(`needle number ${next} `)
        expect(printed(second.text)[0]).not.toBe(shown[0])
        expect((second.data as { total: number }).total).toBe(40)
    })

    it('fails past the last match', async () => {
        await expect(find(findSession(), { text: 'needle', offset: 40 })).rejects.toThrow('--offset 40 is past the last of 40 matches')
    })
})

function readSession (page: { text: string, truncated: boolean, cut?: boolean }, displayed = true) {
    const execute = vi.fn(async (_fn: unknown, ...args: unknown[]) => args.length === 1 ? undefined : { from: 'main', cut: false, ...page })
    const element = { elementId: 'el-1', isDisplayed: async () => displayed }
    const session = {
        isWeb: true,
        applies: ['W'],
        cmd: cmdWith(),
        get: () => undefined,
        refs: new RefRegistry(),
        browser: { execute, $: () => ({ getElement: async () => element }) }
    } as unknown as Session
    return { session, execute }
}

describe('read --offset', () => {
    it('asks the page for offset + max-chars and prints from the offset', async () => {
        const { session, execute } = readSession({ text: '0123456789', truncated: true })
        const result = await read(session, { maxChars: 4, offset: 6 })
        expect(execute.mock.calls[0][2]).toBe(10)
        expect(result.text.startsWith('6789\n')).toBe(true)
        expect(result.text).toContain('characters 6–10')
        expect(result.text).toContain('--offset 10')
    })

    it('leaves out the ellipsis of a cut paragraph from the next offset', async () => {
        const { session } = readSession({ text: '0123456…', truncated: true, cut: true })
        expect((await read(session, { maxChars: 4, offset: 2 })).text).toContain('--offset 7')
    })

    it('names the offset when the first part is cut', async () => {
        const { session } = readSession({ text: 'abcd', truncated: true })
        expect((await read(session, { maxChars: 4 })).text).toContain('--offset 4')
    })

    it('says so when the offset is past the end', async () => {
        const { session } = readSession({ text: 'abc', truncated: false })
        expect((await read(session, { offset: 50 })).text).toContain('--offset 50 is past the end')
    })
})

describe('read --scope scrolls', () => {
    it('scrolls the scoped element into view', async () => {
        const { session, execute } = readSession({ text: 'abc', truncated: false })
        await read(session, { scope: 'main' })
        expect(execute.mock.calls[0]).toHaveLength(2)
    })

    it('does not scroll a hidden element', async () => {
        const { session, execute } = readSession({ text: 'abc', truncated: false }, false)
        await read(session, { scope: 'main' })
        expect(execute).toHaveBeenCalledTimes(1)
        expect(execute.mock.calls[0]).toHaveLength(3)
    })

    it('does not scroll without a scope', async () => {
        const { session, execute } = readSession({ text: 'abc', truncated: false })
        await read(session, {})
        expect(execute).toHaveBeenCalledTimes(1)
    })
})
