import { vi } from 'vitest'
import { ACTIONS } from '@wdio/session'
import type { AgentSession, RefEntry } from '@wdio/session/agent'

export interface FakeRun {
    text?: string
    code?: string
    error?: string
}

/**
 * An `AgentSession` stand-in for a web page: the real action specs, a `run`
 * spy that answers from `responses` and refs a test can define.
 */
export function fakeAgent (responses: (action: string, args: Record<string, unknown>) => FakeRun | undefined = () => undefined) {
    const refs = new Map<string, RefEntry>()
    const run = vi.fn(async (action: string, args: Record<string, unknown> = {}) => {
        const response = responses(action, args) || { text: `${action} ok` }
        if (response.error) {
            throw new Error(response.error)
        }
        if (typeof args.target === 'string' && refs.has(args.target)) {
            const entry = refs.get(args.target)!
            entry.selector = entry.selector || entry.candidates[0]
        }
        return { text: response.text, code: response.code }
    })
    const waitForExist = vi.fn().mockResolvedValue(true)
    /**
     * how many elements a selector matches, for healing
     */
    const matches = new Map<string, number>()
    const $$ = vi.fn((selector: string) => ({ getElements: vi.fn(async () => Array.from({ length: matches.get(selector) ?? 0 }, () => ({}))) }))
    const agent = {
        session: { plan: { applies: ['W'], platform: 'browser', label: 'chrome' } },
        browser: { $: vi.fn(() => ({ waitForExist })), $$, options: { waitforTimeout: 100 } },
        actions: ACTIONS.filter((spec) => !spec.applies || spec.applies.includes('W')),
        run,
        pin: vi.fn(async () => 'e100'),
        contains: vi.fn(async () => true),
        snapshot: vi.fn(),
        ref: (id: string) => refs.get(id.replace(/^@/, '')),
        history: [],
        logs: [],
        network: [],
        dispose: vi.fn()
    } as unknown as AgentSession & { run: typeof run }
    return {
        agent,
        run,
        waitForExist,
        $$,
        matches,
        setRef (entry: Omit<RefEntry, 'kind' | 'generation'>) {
            refs.set(entry.id, { kind: 'web', generation: 1, ...entry })
        }
    }
}
