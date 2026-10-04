import fs from 'node:fs'
import path from 'node:path'

import logger from '@wdio/logger'

import { ACTION_MAP } from './actions/specs.js'
import { PAGE_LOAD_TIMEOUT_MS } from './actions/interact.js'
import { IMPLEMENTATIONS, type ActionArgs } from './actions/index.js'
import { SessionError, usage } from './errors.js'
import { History } from './history.js'
import { RingBuffer, type LogEntry, type NetworkEntry } from './daemon/events.js'
import { RefRegistry, refId } from './snapshot/refs.js'
import { backToTop, describeNewTabs, dialogOpenError, holdFrame, openDialog } from './actions/contexts.js'
import { OBSERVED_ACTIONS, describeChanges, pageState, type PageState } from './actions/changes.js'
import { botCheckNote, detectBotCheck } from './actions/botcheck.js'
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
    /A session is either terminated or not started/i
]

/**
 * the frame or page an action ran in went away, the browser didn't: a frame
 * that reloaded (bot checks replace their widget every few seconds) or a page
 * that navigated while the action ran
 */
const CONTEXT_GONE = /browsing context has been discarded|no such frame/i

/**
 * actions that do not touch the page and keep working while a dialog blocks it
 */
/**
 * actions that can open a tab: a link with `target="_blank"`, a form that
 * submits into one, a script calling `window.open`
 */
const TAB_OPENERS = new Set(['click', 'tap', 'press', 'select', 'check', 'uncheck'])

const DIALOG_SAFE_ACTIONS = new Set(['dialog', 'info', 'close', 'resume', 'logs', 'requests', 'history', 'export', 'helpers', 'trace', 'record'])

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
    /**
     * `false` keeps the step history in memory instead of `history.json`
     */
    persistHistory?: boolean
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
    /** page as of the last observed action, the baseline for the next one's changes */
    lastPage?: PageState
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
    #pageLoadLimited = false

    constructor (init: SessionInit) {
        this.name = init.name
        this.cwd = init.cwd
        this.artifactsDir = init.artifactsDir
        this.runtimeDir = init.runtimeDir
        this.browser = init.browser
        this.plan = init.plan
        fs.mkdirSync(this.artifactsDir, { recursive: true })
        this.history = new History(this.artifactsDir, { keep: init.keepHistory, persist: init.persistHistory })
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
    /**
     * WebDriver waits up to five minutes for a page to load after a click or
     * a navigation. Pages full of ads and trackers can take that long, and the
     * session can't do anything else meanwhile. An agent is better served by
     * the page as it is after a while: actions report "still loading" instead
     * (see `withNavigation`). A `timeouts.pageLoad` capability wins.
     */
    async limitPageLoad () {
        if (this.#pageLoadLimited || !this.isWeb) {
            return
        }
        this.#pageLoadLimited = true
        const requested = (this.plan?.capabilities as { timeouts?: { pageLoad?: number } } | undefined)?.timeouts?.pageLoad
        if (requested === undefined && typeof this.browser.setTimeout === 'function') {
            await Promise.resolve(this.browser.setTimeout({ pageLoad: PAGE_LOAD_TIMEOUT_MS })).catch(() => {})
        }
    }

    async dispatch (req: Pick<Request, 'action' | 'args' | 'cwd'>): Promise<ActionResult> {
        await this.limitPageLoad()
        const spec = ACTION_MAP.get(req.action)
        const impl = IMPLEMENTATIONS[req.action]
        if (!spec) {
            throw usage(`Unknown action "${req.action}".`, 'Run `wdio session --help` for the list of actions.')
        }
        if (spec.applies && !spec.applies.some((a) => this.applies.includes(a))) {
            throw new SessionError('NOT_SUPPORTED', `"${req.action}" is not supported for ${this.plan.label} sessions.`)
        }
        if (!impl) {
            throw new SessionError('NOT_SUPPORTED', `"${req.action}" is not available in this version of @wdio/session.`)
        }
        const dialog = openDialog(this)
        if (dialog && !DIALOG_SAFE_ACTIONS.has(req.action)) {
            throw dialogOpenError(dialog)
        }
        const args: ActionArgs = { ...req.args, $cwd: req.cwd || this.cwd }
        const trace = this.get<{ before: (a: string, args: ActionArgs) => Promise<void>, after: (a: string, args: ActionArgs, r?: ActionOutcome, e?: SessionError) => Promise<void> }>('trace')
        const pagePath = spec.mutation || req.action === 'exec' ? await this.currentPath() : undefined
        await trace?.before(req.action, args)
        // page scripts can't run while a dialog is open, so there is no report then
        const observe = this.isWeb && OBSERVED_ACTIONS.has(req.action) && process.env.WDIO_SESSION_CHANGES !== '0' && !dialog
        const before = observe ? (this.lastPage ?? await pageState(this)) : undefined
        // `click --new-tab` reports its tab itself
        const tabsBefore = observe && TAB_OPENERS.has(req.action) && !args.newTab
            ? await this.browser.getWindowHandles().catch(() => undefined)
            : undefined
        try {
            const outcome = await this.#inFrameOf(req.action, args, () => impl(this, args))
            const newTabs = tabsBefore && await describeNewTabs(this, tabsBefore)
            if (newTabs) {
                outcome.text = [outcome.text, newTabs].filter(Boolean).join('\n')
            }
            if (before && openDialog(this)) {
                this.lastPage = undefined
            } else if (before) {
                // another frame is another document: list it rather than diff it
                const { text, after } = req.action === 'frame'
                    ? await describeChanges(this, {}, this.get('frame') ? 'Frame' : 'Page')
                    : await describeChanges(this, before)
                // no text means no answer in time (see describeChanges): start over next time
                this.lastPage = after.text ? after : undefined
                if (text) {
                    outcome.text = [outcome.text, text].filter(Boolean).join('\n')
                }
            } else if (spec.mutation || req.action === 'exec' || req.action === 'wait') {
                // the page may have changed without a report (scroll, drag, code,
                // content that loaded while waiting): the next report starts over
                this.lastPage = undefined
            }
            const page = req.action === 'snapshot' ? outcome.text : observe ? this.lastPage?.text : undefined
            if (this.isWeb && page) {
                outcome.text = [outcome.text, await this.#botCheck(page)].filter(Boolean).join('\n')
            }
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
            // a failed action may still have changed the page
            if (before || spec.mutation || req.action === 'exec') {
                this.lastPage = undefined
            }
            let error = SessionError.from(err, req.action === 'exec' ? 'EXEC_ERROR' : 'INTERNAL')
            if (!(err instanceof SessionError) && CONTEXT_GONE.test(error.message)) {
                const inFrame = Boolean(this.get('activeContext'))
                await backToTop(this).catch(() => {})
                this.lastPage = undefined
                error = new SessionError('CONTEXT_GONE', inFrame
                    ? 'The frame went away while the action ran (it reloaded or was removed). The session is back on the top document.'
                    : 'The page went away while the action ran (it navigated or closed).', {
                    hint: inFrame
                        ? 'Run `wdio session snapshot -i` and enter the new frame with `wdio session frame <ref>`.'
                        : 'Run `wdio session snapshot -i` to see where the tab is now, or `wdio session tabs`.',
                    details: (err as Error)?.message
                })
            } else if (!(err instanceof SessionError) && isDeadSessionError(err)) {
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
     * Run an action on a ref from a frame the snapshot showed inline (see
     * `inlineFrames`) inside that frame, then go back to the top document.
     * The recorded code enters the frame in a block of its own, so it
     * replays on its own.
     */
    async #inFrameOf (action: string, args: ActionArgs, run: () => Promise<ActionOutcome>): Promise<ActionOutcome> {
        if (action === 'frame' || !this.isBidi) {
            return run()
        }
        const frames = new Set([args.target, args.from, args.to]
            .map((value) => typeof value === 'string' ? refId(value) : undefined)
            .map((id) => id ? this.refs.get(id)?.frame : undefined)
            .filter((frame): frame is string => Boolean(frame)))
        if (!frames.size) {
            return run()
        }
        if (frames.size > 1) {
            throw usage('These refs are in different frames.', 'Act on one frame at a time.')
        }
        const [frame] = frames
        const current = this.get<string>('frame')
        if (current === frame || current?.startsWith(`${frame} `)) {
            return run()
        }
        const held = await holdFrame(this, frame)
        let outcome: ActionOutcome
        try {
            outcome = await run()
        } finally {
            await held.release().catch(() => {})
        }
        const wrap = (code?: string) => code
            ? ['{', ...[...held.lines, ...code.split('\n')].map((line) => `    ${line}`), '}'].join('\n')
            : code
        return { ...outcome, history: wrap(outcome.history), code: wrap(outcome.code) }
    }

    /**
     * A note when the page is a bot check, once per URL: agents otherwise
     * spend dozens of steps waiting on it or clicking it.
     */
    async #botCheck (snapshot: string) {
        const vendor = detectBotCheck(snapshot)
        const url = await this.currentUrl()
        if (!vendor) {
            this.set('botCheckUrl', undefined)
            return undefined
        }
        if (this.get('botCheckUrl') === url) {
            return undefined
        }
        this.set('botCheckUrl', url)
        return botCheckNote(vendor, { headless: this.plan.headless !== false, target: String(this.plan.target ?? 'chrome'), url })
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
