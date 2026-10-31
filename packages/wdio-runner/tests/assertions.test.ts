import path from 'node:path'
import { AsyncLocalStorage } from 'node:async_hooks'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { expect as wdioExpect, wdioCustomMatchers, SnapshotService } from 'expect-webdriverio'
import { registerUserCommands, runUserCommand, setUserCommandStore } from '@wdio/utils'

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
