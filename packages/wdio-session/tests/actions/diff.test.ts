import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterAll, describe, expect, it } from 'vitest'

import { diff, find, snapshot, takeSnapshot } from '../../src/actions/observe.js'
import { RefRegistry } from '@wdio/snapshot'
import type { SnapshotNode } from '@wdio/snapshot'
import type { Session } from '../../src/session.js'

const doc = (children: SnapshotNode[]): SnapshotNode => ({ role: 'document', name: 'Shop', children })
const refs = [{ id: 'e1', role: 'button', name: 'Add', candidates: [{ kind: 'testid', selector: '[data-testid="add"]' }] }]
const artifacts = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-diff-'))
afterAll(() => fs.rmSync(artifacts, { recursive: true, force: true }))

function pageSession (page: { tree: SnapshotNode }) {
    return {
        isWeb: true,
        applies: ['W'],
        currentUrl: async () => 'https://shop.test/',
        refs: new RefRegistry(),
        get: () => undefined,
        timestamp: () => 't',
        artifact: (...segments: string[]) => {
            const file = path.join(artifacts, ...segments)
            fs.mkdirSync(path.dirname(file), { recursive: true })
            return file
        },
        browser: {
            execute: async (fn: unknown, json?: string, scope?: unknown) => {
                if (scope) {
                    return { tree: doc([{ role: 'button', name: 'Add', ref: 'e1', interactive: true, box: [0, 40, 50, 20] }]), refs, counter: 1 }
                }
                const all = String(json).includes('"all":true')
                const tree = structuredClone(page.tree)
                tree.children = tree.children?.filter((node) => all || !node.hidden)
                return { tree, refs, counter: 1 }
            }
        }
    } as unknown as Session
}

const page = () => ({
    tree: doc([
        { role: 'heading', name: 'Top', box: [0, 0, 100, 20] },
        { role: 'button', name: 'Add', ref: 'e1', interactive: true, box: [0, 40, 50, 20] },
        { role: 'button', name: 'Far', interactive: true, box: [0, 2000, 50, 20] },
        { role: 'status', name: 'Hidden', hidden: true }
    ])
})

describe('diff baseline', () => {
    it.each([
        ['--selectors', { selectors: true }],
        ['--depth', { depth: 1 }],
        ['--compact', { compact: true }],
        ['--boxes', { boxes: true }]
    ])('finds no changes on an unchanged page after snapshot %s', async (_label, opts) => {
        const session = pageSession(page())
        await takeSnapshot(session, opts)
        expect((await diff(session, { $cwd: '/' })).text).toBe('No changes')
    })

    it('leaves the baseline alone after a web --viewport snapshot, which is cut in the page', async () => {
        const session = pageSession(page())
        await takeSnapshot(session, {})
        const baseline = session.lastSnapshot
        await takeSnapshot(session, { viewport: true })
        expect(session.lastSnapshot).toBe(baseline)
    })

    it('compares an interactive diff with the interactive baseline', async () => {
        const session = pageSession(page())
        await takeSnapshot(session, { interactive: true, selectors: true })
        expect((await diff(session, { interactive: true, $cwd: '/' })).text).toBe('No changes')
    })

    it('keeps the snapshot as the baseline when find has to retry with --all', async () => {
        const session = pageSession(page())
        await takeSnapshot(session, {})
        const baseline = session.lastSnapshot
        await expect(find(session, { text: 'no such text anywhere' })).rejects.toThrow('No match')
        expect(session.lastSnapshot).toBe(baseline)
    })
})

describe('snapshot --diff', () => {
    const NOTE = 'No previous snapshot, printing this one; the next --diff compares with it.'
    const OTHER_VIEW_NOTE = 'Previous snapshot was taken with other --scope, -i, --all or --urls options, printing this one'

    it('prints the whole snapshot with a note when there is no baseline', async () => {
        const session = pageSession(page())
        const result = await snapshot(session, { diff: true, $cwd: '/' })
        expect(result.text.startsWith(NOTE)).toBe(true)
        expect(result.text).toContain('button "Add" [ref=e1]')
    })

    it('reports changed and diff in the data of a diff, and no changed without a baseline', async () => {
        const state = page()
        const session = pageSession(state)
        expect((await snapshot(session, { diff: true, $cwd: '/' })).data).not.toHaveProperty('changed')
        state.tree.children![1].name = 'Buy'
        const { data } = await snapshot(session, { diff: true, $cwd: '/' })
        expect(data).toMatchObject({ changed: true, diff: expect.stringContaining('@@') })
    })

    it('prints the whole snapshot with a note after a snapshot --scope, not a diff that removes the rest', async () => {
        const session = pageSession(page())
        Object.assign(session.refs, { resolve: async () => ({}) })
        await snapshot(session, { scope: 'e1', $cwd: '/' })
        const result = await snapshot(session, { diff: true, $cwd: '/' })
        expect(result.text.startsWith(OTHER_VIEW_NOTE)).toBe(true)
        expect(result.text).toContain('heading "Top"')
    })

    it('prints the whole snapshot with a note after a snapshot without -i, not a diff that removes the rest', async () => {
        const session = pageSession(page())
        await snapshot(session, { $cwd: '/' })
        const result = await snapshot(session, { interactive: true, diff: true, $cwd: '/' })
        expect(result.text.startsWith(OTHER_VIEW_NOTE)).toBe(true)
        expect(result.text).toContain('button "Add" [ref=e1]')
    })

    it('prints the whole snapshot with a note after a snapshot --all, not a diff that removes the hidden nodes', async () => {
        const session = pageSession(page())
        await snapshot(session, { all: true, $cwd: '/' })
        const result = await snapshot(session, { diff: true, $cwd: '/' })
        expect(result.text.startsWith(OTHER_VIEW_NOTE)).toBe(true)
    })

    it('keeps the view of the baseline after a find that looked in hidden nodes', async () => {
        const session = pageSession(page())
        await expect(find(session, { text: 'Nowhere', $cwd: '/' })).rejects.toMatchObject({ code: 'NO_MATCH' })
        const result = await snapshot(session, { urls: true, all: true, diff: true, $cwd: '/' })
        expect(result.text.startsWith(OTHER_VIEW_NOTE)).toBe(true)
    })

    it('keeps the view of a find baseline without the link URLs that find drops', async () => {
        const session = pageSession({ tree: doc([{ role: 'link', name: 'Docs', ref: 'e7', url: 'https://shop.test/docs' }]) })
        await find(session, { text: 'Docs', $cwd: '/' })
        const result = await snapshot(session, { urls: true, diff: true, $cwd: '/' })
        expect(result.text.startsWith(OTHER_VIEW_NOTE)).toBe(true)
    })

    it('leaves diff out of the arguments a next-part hint repeats', async () => {
        const hinted: Record<string, unknown>[] = []
        const items = doc(Array.from({ length: 40 }, (_, i) => ({ role: 'button', name: `Item ${i}`, interactive: true })))
        const session = Object.assign(pageSession({ tree: items }), {
            cmd: (_command: string, args: Record<string, unknown> | undefined, text: string) => {
                hinted.push(args ?? {})
                return text
            }
        })
        await snapshot(session, { diff: true, maxChars: 200, $cwd: '/' })
        expect(hinted.length).toBeGreaterThan(0)
        expect(hinted.every((args) => !('diff' in args))).toBe(true)
    })

    it('rejects --offset before taking the snapshot', async () => {
        const session = pageSession(page())
        await expect(snapshot(session, { diff: true, offset: 5, $cwd: '/' })).rejects.toMatchObject({ code: 'USAGE' })
        expect(session.lastSnapshot).toBeUndefined()
    })

    it('cuts a long diff at a line, with the whole snapshot named', async () => {
        const items = (suffix: string): SnapshotNode => doc(Array.from({ length: 40 }, (_, i) => ({ role: 'button', name: `Item ${i} ${suffix}`, interactive: true })))
        const state = { tree: items('a') }
        const session = pageSession(state)
        await snapshot(session, { diff: true, $cwd: '/' })
        state.tree = items('b')
        const result = await snapshot(session, { diff: true, maxChars: 300, $cwd: '/' })
        expect(result.text).toMatch(/… diff cut at line \d+ of \d+; whole snapshot: /)
        expect(result.text.slice(0, result.text.indexOf('\n… diff cut')).length).toBeLessThanOrEqual(300)
        expect(result.data).toMatchObject({ cut: true, changed: true })
        expect((result.data as { diff: string }).diff.length).toBeGreaterThan(result.text.length)
    })

    it('prints No changes on an unchanged page', async () => {
        const session = pageSession(page())
        await snapshot(session, { diff: true, $cwd: '/' })
        expect((await snapshot(session, { diff: true, $cwd: '/' })).text).toBe('No changes')
    })

    it('prints a hunk with the changed line after the page changes', async () => {
        const state = page()
        const session = pageSession(state)
        await snapshot(session, { diff: true, $cwd: '/' })
        state.tree.children![1].name = 'Buy'
        const result = await snapshot(session, { diff: true, $cwd: '/' })
        expect(result.text).toContain('@@')
        expect(result.text).toMatch(/^-.*button "Add"/m)
        expect(result.text).toMatch(/^\+.*button "Buy"/m)
    })

    it('compares the canonical text, so printed boxes do not show as changes', async () => {
        const session = pageSession(page())
        await snapshot(session, { diff: true, $cwd: '/' })
        expect((await snapshot(session, { boxes: true, diff: true, $cwd: '/' })).text).toBe('No changes')
    })

    it('rejects a web --viewport snapshot before taking it', async () => {
        const session = pageSession(page())
        await expect(snapshot(session, { diff: true, viewport: true, $cwd: '/' })).rejects.toMatchObject({ code: 'USAGE' })
    })
})

describe('find on a long line', () => {
    const matchesOf = (result: { data?: unknown }) => (result.data as { matches: { text: string }[] }).matches
    const printedOf = (result: { text: string }) => result.text.split('\n').find((line) => line.startsWith('2:'))!
    const long = (needle: string) => `${'x'.repeat(500)} ${needle} ${'y'.repeat(500)}`

    it.each([
        ['a plain query', { text: 'NEEDLE' }, long('needle')],
        ['a regex', { text: 'need[l]e\\b', regex: true }, long('needle')],
        ['all words of the query', { text: 'needle haystack' }, long('haystack and a needle')],
        ['the query without spaces', { text: 'SO2' }, long('SO 2')]
    ])('keeps the match of %s in the printed line and the data', async (_label, args, name) => {
        const session = pageSession({ tree: doc([{ role: 'code', name }]) })
        const result = await find(session, args)
        const word = /need|SO ?2/i
        const printed = printedOf(result)
        expect(printed).toMatch(word)
        expect(printed.startsWith('2:…')).toBe(true)
        expect(printed.endsWith('…')).toBe(true)
        expect(printed.length).toBeLessThanOrEqual('2:'.length + 300)
        const [match] = matchesOf(result)
        expect(match.text).toMatch(word)
        expect(match.text.length).toBeLessThanOrEqual(300)
    })

    it('keeps the start of a line whose match is near it', async () => {
        const session = pageSession({ tree: doc([{ role: 'code', name: `needle ${'x'.repeat(500)}` }]) })
        const result = await find(session, { text: 'needle' })
        expect(printedOf(result)).toMatch(/^2: {2}- code "needle x+…$/)
        expect(matchesOf(result)[0].text).toHaveLength(300)
    })

    it('shows the end of a line whose match is at it, without a trailing ellipsis', async () => {
        const session = pageSession({ tree: doc([{ role: 'code', name: `${'x'.repeat(500)} needle` }]) })
        const result = await find(session, { text: 'needle' })
        expect(printedOf(result)).toMatch(/^2:…x+ needle"$/)
        expect(matchesOf(result)[0].text).toHaveLength(300)
    })

    const link = (name: string) => ({ role: 'link', name, ref: 'e7', url: `${'x'.repeat(900)}needle${'y'.repeat(50)}` })

    it('keeps the ref of a line whose match is late in it', async () => {
        const session = pageSession({ tree: doc([link('Docs')]) })
        const result = await find(session, { text: 'needle' })
        const printed = printedOf(result)
        expect(printed).toMatch(/^2: {2}- link "Docs" \[ref=e7\] …x+needley{50}$/)
        expect(printed.length).toBeLessThanOrEqual('2:'.length + 300)
        expect(matchesOf(result)[0].text).toBe('  - link "Docs" [ref=e7]')
    })

    it('keeps only the role and ref of a line whose name is long', async () => {
        const session = pageSession({ tree: doc([link('n'.repeat(200))]) })
        const result = await find(session, { text: 'needle' })
        const printed = printedOf(result)
        expect(printed).toMatch(/^2: {2}- link \[ref=e7\] …x+needley{50}$/)
        expect(printed.length).toBeLessThanOrEqual('2:'.length + 300)
    })

    it('keeps the ref of a long label whose match is at its start', async () => {
        const session = pageSession({ tree: doc([{ role: 'button', name: `needle ${'x'.repeat(400)}`, ref: 'e9' }]) })
        const result = await find(session, { text: 'needle' })
        const printed = printedOf(result)
        expect(printed).toMatch(/^2: {2}- button "needle x+….* \[ref=e9\]$/)
        expect(printed.length).toBeLessThanOrEqual('2:'.length + 300)
        expect(matchesOf(result)[0].text).toMatch(/\[ref=e9\]$/)
    })

    it('windows a line without a ref around its match as before', async () => {
        const session = pageSession({ tree: doc([{ role: 'link', name: 'Docs', url: `${'x'.repeat(900)}needle${'y'.repeat(50)}` }]) })
        const result = await find(session, { text: 'needle' })
        expect(printedOf(result)).toMatch(/^2:…x+needley{50}$/)
        expect(printedOf(result).length).toBe('2:'.length + 300)
    })
})
