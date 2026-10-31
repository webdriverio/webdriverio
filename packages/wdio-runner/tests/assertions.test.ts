import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { expect as wdioExpect, wdioCustomMatchers, SnapshotService } from 'expect-webdriverio'
import { some } from 'expect-webdriverio/api'
import { registerUserCommands, runUserCommand, setUserCommandStore, setWdioKind, WDIO_CHAINABLE, WDIO_QUERY } from '@wdio/utils'

import { wrapAssertions } from '../src/assertions.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

setUserCommandStore(new AsyncLocalStorage())
registerUserCommands(['getText'])

const browser = { isBidi: true, options: { userCommandEvents: true }, emit: vi.fn() }
// polls like an expect-webdriverio matcher: one getText for each poll, "Done" at the third poll
async function toPollText (this: unknown, _received: unknown, text: string) {
    let value = ''
    for (let poll = 0; poll < 3; poll++) {
        value = await runUserCommand(browser, 'getText', [], async () => poll < 2 ? 'Click' : 'Done')
    }
    return { pass: value === text, message: () => `\u001b[31mexpected ${text}\u001b[39m` }
}

const events = () => browser.emit.mock.calls.map(([event, payload]) => [event, payload.command, payload.body, payload.result])

wdioExpect.extend({ toPollText })
wrapAssertions(wdioExpect, wdioCustomMatchers, () => browser)

beforeEach(() => {
    browser.emit.mockClear()
})

describe('wrapAssertions', () => {
    it('sends one user command for an assertion, and its polls send nothing', async () => {
        await (wdioExpect('el') as any).toPollText('Done')
        expect(events()).toEqual([
            ['userCommand', 'expect.toPollText', ['el', 'Done'], undefined],
            ['userResult', 'expect.toPollText', ['el', 'Done'], { value: undefined }]
        ])
    })

    it('sends the message of an assertion that fails as the error, with no colors', async () => {
        await expect((wdioExpect('el') as any).toPollText('Nope')).rejects.toThrow('expected Nope')
        const [, , , result] = events()[1]
        expect(result.error).toBeInstanceOf(Error)
        expect(result.error.message).toBe('expected Nope')
    })

    it('gives a .not assertion its own name and the status of the negated assertion', async () => {
        await (wdioExpect('el') as any).not.toPollText('Nope')
        expect(events()[1]).toEqual(['userResult', 'expect.not.toPollText', ['el', 'Nope'], { value: undefined }])

        browser.emit.mockClear()
        await expect((wdioExpect('el') as any).not.toPollText('Done')).rejects.toThrow()
        expect(events()[1][3].error.message).toBe('expected Done')
    })

    it('gives expect the result of the matcher as it is', async () => {
        const extend = vi.fn()
        const result = { pass: true, message: () => 'ok' }
        wrapAssertions({ extend }, { toBeOk: async () => result }, () => browser)
        const [[matchers]] = extend.mock.calls
        expect(await matchers.toBeOk.call({ isNot: false }, 'el')).toBe(result)
    })

    it('wraps a matcher one time', async () => {
        const extend = vi.fn()
        wrapAssertions({ extend }, wdioCustomMatchers, () => browser)
        expect(extend).not.toHaveBeenCalled()
        await (wdioExpect('el') as any).toPollText('Done')
        expect(events()).toHaveLength(2)
    })

    it('keeps the call site of an inline snapshot in the test file', async () => {
        const assert = vi.fn()
        const spy = vi.spyOn(SnapshotService, 'initiate').mockReturnValue({ client: { assert }, currentFilePath: 'test.e2e.ts', currentTestName: 'test' } as never)
        await wdioExpect('el').toMatchInlineSnapshot('"el"')
        spy.mockRestore()
        // the rule of Vitest: the call site is two frames below the frame of `__INLINE_SNAPSHOT__`
        const frames = (assert.mock.calls[0][0].error.stack as string).split('\n')
        const callSite = frames[frames.findIndex((line) => line.includes('__INLINE_SNAPSHOT__')) + 2]
        expect(callSite).toContain('assertions.test.ts')
    })
})

describe('wrapAssertions session of the subject', () => {
    // instance A of a multi-remote browser, the session of the polls; `fallback` is the browser of the runner
    const instanceA = setWdioKind({ isBidi: true, sessionId: 'a', options: { userCommandEvents: true }, emit: vi.fn() }, 'browser')
    const fallback = setWdioKind({ isMultiRemote: true, instances: ['a'], emit: vi.fn() }, 'browser')
    async function toPollOnA (this: unknown, _received: unknown, text: string) {
        let value = ''
        for (let poll = 0; poll < 3; poll++) {
            value = await runUserCommand(instanceA, 'getText', [], async () => poll < 2 ? 'Click' : 'Done')
        }
        return { pass: value === text, message: () => `expected ${text}` }
    }
    const extend = vi.fn()
    wrapAssertions({ extend }, { toPollOnA }, () => fallback)
    const [[{ toPollOnA: wrapped }]] = extend.mock.calls
    const commandsOf = (session: { emit: ReturnType<typeof vi.fn> }) => session.emit.mock.calls.map(([event, payload]) => `${event} ${payload.command}`)
    const assertion = ['userCommand expect.toPollOnA', 'userResult expect.toPollOnA']

    beforeEach(() => {
        instanceA.emit.mockClear()
        fallback.emit.mockClear()
    })

    it.each([
        ['an element of instance A', () => setWdioKind({ elementId: 'e1', parent: instanceA }, 'element')],
        ['a pending element of instance A', () => Object.assign(setWdioKind({}, 'element'), { [WDIO_CHAINABLE]: true, [WDIO_QUERY]: { foundWith: '$', selector: '#x', parent: instanceA } })],
        ['an element list of instance A', () => setWdioKind(Object.assign([], { parent: instanceA }), 'element-array')],
        ['instance A', () => instanceA],
        ['a browsing context of instance A', () => setWdioKind({ contextId: 'tab-1', browser: instanceA }, 'browsing-context')],
        ['the some() of an element list of instance A', () => some(setWdioKind(Object.assign([], { parent: instanceA }), 'element-array'))]
    ])('sends one user command on the session of %s', async (_name, subject) => {
        await wrapped.call({ isNot: false }, subject(), 'Done')
        expect(commandsOf(instanceA)).toEqual(assertion)
        expect(commandsOf(fallback)).toEqual([])
    })

    it('sends the some() of expect-webdriverio as data around its elements', async () => {
        const list = setWdioKind(Object.assign([], { foundWith: '$$', selector: 'li', props: [], parent: instanceA }), 'element-array')
        await wrapped.call({ isNot: false }, some(list), 'Done')
        const [, { body }] = instanceA.emit.mock.calls[0]
        expect(body).toEqual([{ wdio: 'some', elements: { wdio: 'element-array', query: [{ foundWith: '$$', selector: 'li' }], length: 0 } }, 'Done'])
    })

    it('uses the browser of the runner for a subject with no session, for example a mock', async () => {
        const runner = { isBidi: true, sessionId: 'r', options: { userCommandEvents: true }, emit: vi.fn() }
        const ext = vi.fn()
        wrapAssertions({ extend: ext }, { toPollOnA }, () => runner)
        const [[{ toPollOnA: onRunner }]] = ext.mock.calls
        await onRunner.call({ isNot: false }, setWdioKind({ url: '**/api' }, 'mock'), 'Done')
        expect(commandsOf(runner)).toEqual(assertion)
        expect(commandsOf(instanceA)).toEqual([])
    })

    it('keeps the commands of an element of all instances as the commands of each instance', async () => {
        await wrapped.call({ isNot: false }, setWdioKind({ elementId: 'e1', isMultiRemote: true }, 'element'), 'Done')
        expect(commandsOf(instanceA)).toEqual(Array(3).fill(['userCommand getText', 'userResult getText']).flat())
    })
})
