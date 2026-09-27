import fs from 'node:fs'
import path from 'node:path'

import logger from '@wdio/logger'

import { ACTION_MAP } from './actions/specs.js'
import { IMPLEMENTATIONS, type ActionArgs } from './actions/index.js'
import { SessionError, usage } from './errors.js'
import { History } from './history.js'
import { RingBuffer, type LogEntry, type NetworkEntry } from './daemon/events.js'
import { RefRegistry } from './snapshot/refs.js'
import type { ActionResult, Applies, OpenPlan, PlatformKind, Request } from './types.js'

const log = logger('@wdio/session')

const DEAD_SESSION_PATTERNS = [
    /invalid session id/i,
    /session deleted because of page crash/i,
    /no such session/i,
    /ECONNREFUSED/,
    /chrome not reachable/i,
    /disconnected: not connected to DevTools/i,
    /Session .* does not exist/i,
    /A session is either terminated or not started/i,
    /browsing context has been discarded/i
]

export function isDeadSessionError (err: unknown) {
    const message = (err as Error)?.message || String(err)
    return DEAD_SESSION_PATTERNS.some((p) => p.test(message))
}

export interface SessionInit {
    name: string
    cwd: string
    artifactsDir: string
    runtimeDir: string
    browser: WebdriverIO.Browser
    plan: OpenPlan
    keepHistory?: boolean
}

export interface ActionOutcome extends ActionResult {
    /**
     * code appended to the history, `undefined` records nothing
     */
    history?: string
}

export type ActionFn = (session: Session, args: ActionArgs) => Promise<ActionOutcome>

/**
 * A `wdio session` instance: one WebdriverIO browser object plus the
 * state that actions share (refs, history, event buffers, …).
 */
export class Session {
    readonly name: string
    readonly cwd: string
    readonly artifactsDir: string
    readonly runtimeDir: string
    readonly plan: OpenPlan
    browser: WebdriverIO.Browser
    history: History
    refs = new RefRegistry()
    logs = new RingBuffer<LogEntry>()
    network = new RingBuffer<NetworkEntry>()
    lastSnapshot?: string
    /**
     * arbitrary per-feature state (mocks, emulation, trace, visual, …)
     */
    store = new Map<string, unknown>()
    /**
     * set by the daemon, called when the session must shut down
     */
    onShutdown?: (reason: 'close' | 'died' | 'resume', err?: SessionError) => void
    /**
     * set by the test runner bridge
     */
    onResume?: () => void
    /**
     * the socket server serving this session
     */
    server?: { close: (err?: SessionError) => Promise<void> }
    /**
     * cleanup callbacks run on shutdown (mocks, recordings, watchers, …)
     */
    disposers: (() => unknown)[] = []
    #pending = new Set<string>()

    constructor (init: SessionInit) {
        this.name = init.name
        this.cwd = init.cwd
        this.artifactsDir = init.artifactsDir
        this.runtimeDir = init.runtimeDir
        this.browser = init.browser
        this.plan = init.plan
        fs.mkdirSync(this.artifactsDir, { recursive: true })
        this.history = new History(this.artifactsDir, { keep: init.keepHistory })
    }

    get applies (): Applies[] {
        return this.plan.applies
    }

    get platform (): PlatformKind {
        return this.plan.platform
    }

    get isWeb () {
        return this.applies.includes('W')
    }

    get isBidi () {
        return Boolean((this.browser as unknown as { isBidi?: boolean }).isBidi)
    }

    artifact (...segments: string[]) {
        const file = path.join(this.artifactsDir, ...segments)
        fs.mkdirSync(path.dirname(file), { recursive: true })
        return file
    }

    timestamp () {
        return new Date().toISOString().replace(/[:.]/g, '-')
    }

    get<T> (key: string): T | undefined {
        return this.store.get(key) as T | undefined
    }

    set (key: string, value: unknown) {
        this.store.set(key, value)
    }

    requireBidi (feature: string) {
        if (!this.isBidi) {
            throw new SessionError('BIDI_REQUIRED', `${feature} needs WebDriver BiDi and this session has none.`, {
                hint: 'Reopen the session without --no-bidi, with a BiDi capable browser (Chrome, Edge, Firefox).'
            })
        }
    }

    async currentUrl () {
        if (!this.isWeb) {
            return undefined
        }
        try {
            return await this.browser.getUrl()
        } catch {
            return undefined
        }
    }

    async dispose () {
        for (const fn of this.disposers.splice(0).reverse()) {
            try {
                await fn()
            } catch (err) {
                log.warn(`Cleanup step failed: ${(err as Error).message}`)
            }
        }
    }

    async currentPath () {
        if (!this.isWeb) {
            return undefined
        }
        try {
            return new URL(await this.browser.getUrl()).pathname
        } catch {
            return undefined
        }
    }

    /**
     * Run a request. Requests are serialized by the server.
     */
    async dispatch (req: Pick<Request, 'action' | 'args' | 'cwd'>): Promise<ActionResult> {
        const spec = ACTION_MAP.get(req.action)
        const impl = IMPLEMENTATIONS[req.action]
        if (!spec || !impl) {
            throw usage(`Unknown action "${req.action}".`, 'Run `wdio session --help` for the list of actions.')
        }
        if (spec.applies && !spec.applies.some((a) => this.applies.includes(a))) {
            throw new SessionError('NOT_SUPPORTED', `"${req.action}" is not supported for ${this.plan.label} sessions.`)
        }
        const args: ActionArgs = { ...req.args, $cwd: req.cwd || this.cwd }
        const trace = this.get<{ before: (a: string, args: ActionArgs) => Promise<void>, after: (a: string, args: ActionArgs, r?: ActionOutcome, e?: SessionError) => Promise<void> }>('trace')
        const pagePath = spec.mutation || req.action === 'exec' ? await this.currentPath() : undefined
        await trace?.before(req.action, args)
        try {
            const outcome = await impl(this, args)
            if (outcome.history) {
                this.history.append({
                    kind: req.action === 'exec' ? 'exec' : 'action',
                    code: outcome.history,
                    action: req.action,
                    args: stripInternal(args),
                    path: pagePath
                })
            }
            await trace?.after(req.action, args, outcome)
            const { history: _history, ...result } = outcome
            return result
        } catch (err) {
            let error = SessionError.from(err, req.action === 'exec' ? 'EXEC_ERROR' : 'INTERNAL')
            if (!(err instanceof SessionError) && isDeadSessionError(err)) {
                error = new SessionError('SESSION_DIED', `The ${this.plan.label} session went away: ${error.message}`, {
                    hint: 'Open a new session with `wdio session open`.'
                })
                setTimeout(() => this.onShutdown?.('died', error), 50)
            } else if (error.code === 'INTERNAL') {
                error.hint = error.hint || `See ${path.join(this.artifactsDir, 'daemon.log')} for details.`
                log.error(`Action "${req.action}" failed: ${(err as Error)?.stack || err}`)
            }
            await trace?.after(req.action, args, undefined, error).catch(() => {})
            throw error
        }
    }

    /**
     * track long running async work (e.g. timed out exec) for logging
     */
    trackPending (id: string, promise: Promise<unknown>) {
        this.#pending.add(id)
        promise.finally(() => this.#pending.delete(id)).catch(() => {})
    }
}

function stripInternal (args: ActionArgs) {
    return Object.fromEntries(Object.entries(args).filter(([k]) => !k.startsWith('$')))
}
