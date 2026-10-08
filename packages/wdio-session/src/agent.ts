import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { getContextManager } from 'webdriverio'
import { onlyInteractive, type RefEntry, type SnapshotNode, type SnapshotRef } from '@wdio/snapshot'

import { attachedPlan } from './debug.js'
import { Session } from './session.js'
import { SessionError } from './errors.js'
import type { ErrorCode } from './constants.js'
import type { HintFormatter } from './hints.js'
import { ACTIONS, type ActionSpec } from './actions/specs.js'
import type { SnapshotOptions, TakenSnapshot } from './actions/observe.js'
import type { ActionArgsOf, AgentActionName } from './actions/args.js'
import type { ActionData, ActionDataMap, AgentActionResult, AgentSnapshot, AgentSnapshotOptions, PageChange, PageInfo } from './agent/types.js'
import { startEventCapture } from './daemon/capture.js'
import { formatSnapshot } from './snapshot/render.js'
import { installPageRecorder } from './snapshot/recorder.js'
import type { LogEntry, NetworkEntry } from './daemon/events.js'
import type { HistoryEntry } from './types.js'
import { resolveElement, scopeOf } from './snapshot/target.js'

export type { ActionSpec, LogEntry, NetworkEntry, RefEntry, SnapshotNode, SnapshotOptions, SnapshotRef, TakenSnapshot, HistoryEntry }
export { formatSnapshot, onlyInteractive, SessionError }
export type { ErrorCode, HintFormatter, ActionData, ActionDataMap, AgentActionResult, AgentSnapshot, AgentSnapshotOptions, PageChange, PageInfo, ActionArgsOf, AgentActionName }

export interface AgentSessionOptions {
    /**
     * name used in logs (default `agent`)
     */
    name?: string
    /**
     * project directory relative file arguments resolve against
     * (default `process.cwd()`)
     */
    cwd?: string
    /**
     * directory for files actions write, e.g. screenshots
     * (default: a new temporary directory)
     */
    artifactsDir?: string
    /**
     * collect BiDi console and network events into `logs` and `network`
     * (default `false`)
     */
    captureEvents?: boolean
    /**
     * collect BiDi network events into `network`, which failed requests in
     * `notes` come from; `captureEvents` includes it (default `true`)
     */
    captureNetwork?: boolean
    /**
     * Record closed shadow roots and click listeners in every page loaded
     * from now on, so snapshots include them (needs WebDriver BiDi,
     * default `false`)
     */
    recordPage?: boolean
    /**
     * rewrite the commands named in hints, e.g. `wdio session snapshot`, for
     * the caller's own interface
     */
    hint?: HintFormatter
}

/**
 * The `wdio session` actions, snapshots and refs on a browser that
 * something else started and owns: a test worker, `remote()` or an agent.
 * There is no daemon, socket or state file, and `dispose()` never ends the
 * browser session.
 *
 * @experimental the API, the snapshot text and the `RefEntry` fields may
 * change in a minor release, the ref syntax and recorded code stay stable
 */
export class AgentSession {
    readonly session: Session

    constructor (session: Session) {
        this.session = session
    }

    get browser () {
        return this.session.browser
    }

    /**
     * where refs resolve and selectors are queried: the frame the session
     * holds, otherwise the browser
     */
    get scope () {
        return scopeOf(this.session)
    }

    /**
     * actions that apply to this browser, app or desktop session
     */
    get actions (): ActionSpec[] {
        return (ACTIONS as readonly ActionSpec[]).filter((spec) => !spec.applies || spec.applies.some((a) => this.session.applies.includes(a)))
    }

    /**
     * take a snapshot and register its refs for the next actions
     *
     * @experimental the text layout of the snapshot may change
     */
    async snapshot (opts: AgentSnapshotOptions = {}): Promise<AgentSnapshot> {
        const result = await this.session.dispatch({ action: 'snapshot', args: { ...opts, $agent: true }, cwd: this.session.cwd }, { detail: true })
        const data = result.data as ActionData<'snapshot'>
        return {
            text: result.text ?? '',
            tree: data.tree!,
            lines: data.lines,
            refs: data.refs,
            chars: data.chars,
            tooBig: Boolean(data.tooBig),
            ...(result.page ? { page: result.page } : {}),
            ...(result.notes ? { notes: result.notes } : {})
        }
    }

    /**
     * run a `wdio session` action, e.g. `run('click', { target: 'e3' })`
     */
    run<A extends AgentActionName> (action: A, ...[args]: {} extends ActionArgsOf<A> ? [args?: ActionArgsOf<A>] : [args: ActionArgsOf<A>]): Promise<AgentActionResult<A>> {
        return this.runAction(action, args ?? {}) as Promise<AgentActionResult<A>>
    }

    /**
     * run an action by a name only known at runtime, e.g. from a recorded step
     */
    runAction (action: string, args: Record<string, unknown> = {}): Promise<AgentActionResult> {
        return this.session.dispatch({ action, args, cwd: this.session.cwd }, { detail: true })
    }

    /**
     * role, name and selector candidates of a ref from the latest snapshot
     *
     * @experimental the fields of `RefEntry` may change
     */
    ref (id: string): RefEntry | undefined {
        return this.session.refs.get(id.startsWith('@') ? id.slice(1) : id)
    }

    /**
     * Register an element as a ref, e.g. to scope snapshots to it with
     * `run('snapshot', { scope: ref })`.
     */
    async pin (element: WebdriverIO.Element): Promise<string> {
        const id = this.session.refs.allocate()
        await this.browser.execute(function (el: Element, refId: string) {
            const w = window as unknown as { __wdioSession?: { refs: Map<string, WeakRef<Element>>, ids: WeakMap<Element, string> } }
            const store = w.__wdioSession || (w.__wdioSession = { refs: new Map(), ids: new WeakMap() })
            store.refs.set(refId, new WeakRef(el))
            store.ids.set(el, refId)
        }, element as unknown as Element, id)
        const selector = (element as { selector?: unknown }).selector
        this.session.refs.set({ id, kind: 'web', role: 'scope', candidates: typeof selector === 'string' ? [selector] : [], generation: this.session.refs.generation })
        return id
    }

    /**
     * Make a held tab, window or frame the context the actions run in, like
     * `tabs switch` and `frame` do. Returns a function that goes back to the
     * context before.
     */
    async enter (context: WebdriverIO.BrowsingContext): Promise<() => Promise<void>> {
        const manager = getContextManager(this.browser)
        const previous = await manager.getCurrentContext()
        const previousActive = this.session.get<WebdriverIO.BrowsingContext>('activeContext')
        const previousFrame = { frame: this.session.get<string>('frame'), stack: this.session.get<string[]>('frameStack') }
        const topLevelOf = (held?: WebdriverIO.BrowsingContext): string | undefined => {
            let current = held
            while (current?.isFrame) {
                current = current.parent
            }
            return current?.contextId
        }
        const page = context.isFrame ? topLevelOf(context) : context.contextId
        const previousPage = previousActive ? topLevelOf(previousActive) ?? previous : previous
        if (page && page !== previousPage) {
            await this.browser.switchToWindow(page)
        }
        /**
         * A frame is held, not pointed at: element commands then know the
         * element lives in another navigable than the top-level page.
         */
        manager.setCurrentContext(page ?? context.contextId)
        this.session.set('activeContext', context.isFrame ? context : undefined)
        this.session.set('frame', context.isFrame ? context.url : undefined)
        this.session.set('frameStack', context.isFrame ? [context.url] : [])
        return async () => {
            if (page && page !== previousPage && previousPage) {
                await this.browser.switchToWindow(previousPage).catch(() => {})
            }
            manager.setCurrentContext(previous)
            this.session.set('activeContext', previousActive)
            this.session.set('frame', previousFrame.frame)
            this.session.set('frameStack', previousFrame.stack)
        }
    }

    /**
     * Whether the element of `target` (a ref or selector) is inside the
     * element of `scope`, also across shadow roots. `false` when either
     * cannot be resolved.
     */
    async contains (scope: string, target: string): Promise<boolean> {
        try {
            const [outer, inner] = await Promise.all([resolveElement(this.session, scope), resolveElement(this.session, target)])
            return await this.browser.execute(function (container: Node, node: Node) {
                let current: Node | null = node
                while (current) {
                    if (current === container) {
                        return true
                    }
                    current = current.parentNode || (current as ShadowRoot).host || null
                }
                return false
            }, outer as unknown as Node, inner as unknown as Node)
        } catch {
            return false
        }
    }

    /**
     * the steps that recorded code so far
     */
    get history (): HistoryEntry[] {
        return this.session.history.entries
    }

    get logs (): LogEntry[] {
        return this.session.logs.all()
    }

    get network (): NetworkEntry[] {
        return this.session.network.all()
    }

    /**
     * stop event capture and other cleanup, the browser session stays open
     */
    async dispose () {
        await this.session.dispose()
    }
}

/**
 * Wrap a browser in an `AgentSession`.
 */
export async function createAgentSession (browser: WebdriverIO.Browser, opts: AgentSessionOptions = {}): Promise<AgentSession> {
    const name = opts.name || 'agent'
    const cwd = opts.cwd || process.cwd()
    const artifactsDir = opts.artifactsDir || fs.mkdtempSync(path.join(os.tmpdir(), 'wdio-agent-'))
    const session = new Session({
        name,
        cwd,
        artifactsDir,
        runtimeDir: artifactsDir,
        browser,
        plan: attachedPlan(browser, { name, cwd, artifactsDir, runtimeDir: artifactsDir, target: 'agent' }),
        persistHistory: false,
        hint: opts.hint
    })
    if (opts.captureEvents) {
        await startEventCapture(session)
    } else if (opts.captureNetwork !== false) {
        await startEventCapture(session, { logs: false }).catch(() => {})
    }
    if (opts.recordPage) {
        await installPageRecorder(session).catch(() => {})
    }
    return new AgentSession(session)
}
