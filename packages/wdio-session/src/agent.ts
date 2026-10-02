import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { attachedPlan } from './debug.js'
import { Session } from './session.js'
import { ACTIONS, type ActionSpec } from './actions/specs.js'
import { takeSnapshot, type SnapshotOptions, type TakenSnapshot } from './actions/observe.js'
import { startEventCapture } from './daemon/capture.js'
import { formatSnapshot, onlyInteractive, type SnapshotNode, type SnapshotRef } from './snapshot/format.js'
import type { RefEntry } from './snapshot/refs.js'
import type { LogEntry, NetworkEntry } from './daemon/events.js'
import type { ActionResult, HistoryEntry } from './types.js'

export type { ActionSpec, LogEntry, NetworkEntry, RefEntry, SnapshotNode, SnapshotOptions, SnapshotRef, TakenSnapshot, HistoryEntry }
export { formatSnapshot, onlyInteractive }

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
}

export interface AgentActionResult extends ActionResult {
    /**
     * the WebdriverIO code the action ran, e.g. `await $('role/button[name="Save"]').click()`
     */
    code?: string
}

/**
 * The `wdio session` actions, snapshots and refs on a browser that
 * something else started and owns: a test worker, `remote()` or an agent.
 * There is no daemon, socket or state file, and `dispose()` never ends the
 * browser session.
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
     * actions that apply to this browser, app or desktop session
     */
    get actions (): ActionSpec[] {
        return ACTIONS.filter((spec) => !spec.applies || spec.applies.some((a) => this.session.applies.includes(a)))
    }

    /**
     * take a snapshot and register its refs for the next actions
     */
    snapshot (opts: SnapshotOptions = {}): Promise<TakenSnapshot> {
        return takeSnapshot(this.session, opts)
    }

    /**
     * run a `wdio session` action, e.g. `run('click', { target: 'e3' })`
     */
    run (action: string, args: Record<string, unknown> = {}): Promise<AgentActionResult> {
        return this.session.dispatch({ action, args, cwd: this.session.cwd })
    }

    /**
     * role, name and selector candidates of a ref from the latest snapshot
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
        persistHistory: false
    })
    if (opts.captureEvents) {
        await startEventCapture(session)
    }
    return new AgentSession(session)
}
