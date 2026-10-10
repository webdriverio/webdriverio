import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { createAgentSession } from '../src/agent.js'
import { cliCmd, cmdWith } from '../src/hints.js'

vi.mock('webdriverio', () => ({
    getContextManager: () => ({ getCurrentContext: vi.fn(), setCurrentContext: vi.fn() })
}))

function mockBrowser () {
    return {
        capabilities: { browserName: 'chrome' },
        isBidi: false,
        $: () => ({ getElement: async () => ({}) })
    } as unknown as WebdriverIO.Browser
}

describe('cmdWith', () => {
    it('returns the CLI text without a formatter', () => {
        expect(cmdWith()).toBe(cliCmd)
        expect(cmdWith()('snapshot', undefined, 'wdio session snapshot')).toBe('wdio session snapshot')
    })

    it('uses the value the formatter returns', () => {
        const cmd = cmdWith((command, args) => `${command}:${JSON.stringify(args)}`)
        expect(cmd('frame', { target: 'e3' }, 'cli')).toBe('frame:{"target":"e3"}')
    })

    it('keeps the CLI text when the formatter returns undefined', () => {
        expect(cmdWith(() => undefined)('tabs', undefined, 'wdio session tabs')).toBe('wdio session tabs')
    })

    it('keeps the CLI text when the formatter throws', () => {
        const cmd = cmdWith(() => {
            throw new Error('boom')
        })
        expect(cmd('tabs', undefined, 'wdio session tabs')).toBe('wdio session tabs')
    })
})

describe('Session hints', () => {
    const dirs: string[] = []
    const create = (hint?: (command: string) => string | undefined) => {
        const artifactsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-hints-test-'))
        dirs.push(artifactsDir)
        return createAgentSession(mockBrowser(), { artifactsDir, hint })
    }

    afterEach(() => {
        for (const dir of dirs.splice(0)) {
            fs.rmSync(dir, { recursive: true, force: true })
        }
    })

    it('keeps the CLI hints by default', async () => {
        const { session } = await create()
        const missing = await session.refs.resolve(session.browser, 'e3').catch((err) => err)
        expect(missing.code).toBe('REF_NOT_FOUND')
        expect(missing.hint).toBe('Run `wdio session snapshot` to get refs.')

        session.refs.set({ id: 'e4', kind: 'web', role: 'button', candidates: [], generation: session.refs.generation })
        const stale = await session.refs.resolve(session.browser, 'e4').catch((err) => err)
        expect(stale.code).toBe('REF_STALE')
        expect(stale.hint).toBe('Run `wdio session snapshot` to get fresh refs.')
        expect(session.frameHint('e3')).toBe('wdio session frame e3')
    })

    it('formats hints with the formatter', async () => {
        const { session } = await create((c) => `T:${c}`)
        const missing = await session.refs.resolve(session.browser, 'e3').catch((err) => err)
        expect(missing.hint).toBe('Run `T:snapshot` to get refs.')
        expect(session.frameHint('e3')).toBe('T:frame')
    })

    it('hands the formatter to the session of createAgentSession', async () => {
        const { session } = await create((c) => `T:${c}`)
        expect(session.cmd('open', undefined, 'wdio session open')).toBe('T:open')
    })

    it('leaves out the daemon log hint without a daemon', async () => {
        const agent = await create()
        const err = await agent.session.dispatch({ action: 'navigate', args: { url: 'https://example.com' }, cwd: agent.session.cwd }).catch((e) => e)
        expect(err.hint ?? '').not.toContain('daemon.log')
    })
})
