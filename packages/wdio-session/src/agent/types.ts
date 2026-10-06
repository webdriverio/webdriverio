import type { SnapshotNode } from '@wdio/snapshot'

import type { SnapshotOptions, TakenSnapshot } from '../actions/observe.js'

export interface PageInfo { url?: string; title?: string }

export type PageChange =
    | { kind: 'page'; frame: boolean; url?: string; title?: string; refs: number; snapshot?: string }
    | { kind: 'changed'; added: string[]; omitted: number }
    | { kind: 'removed'; removed: number }

export interface TabData { index: number; handle: string; title: string; url: string; current: boolean }

export interface ContextData { id: string; title?: string; url?: string }

/**
 * What the actions return in `data` today, by action name. Actions that are
 * not listed return `unknown`.
 */
export interface ActionDataMap {
    snapshot: {
        lines: number
        refs: number
        chars: number
        /** the snapshot file, not written by the agent's own `snapshot()` */
        file?: string
        /** the page shown in this answer, when the text is paged */
        from?: number
        to?: number
        /** the whole snapshot text, whatever the text shows */
        snapshot?: string
        tree?: SnapshotNode
        tooBig?: boolean
    }
    find: { matches: { line: number; text: string }[]; total: number; hidden: boolean }
    diff: { changed: boolean; baseline?: boolean; diff?: string }
    read: { chars: number; truncated?: boolean; from?: string }
    screenshot: { file: string; width?: number; height?: number; selector?: string }
    tabs: { tabs?: TabData[]; tab?: TabData }
    get: {
        title?: string
        url?: string
        count?: number
        text?: string
        html?: string
        value?: string | null
        name?: string
        box?: { x: number; y: number; width: number; height: number }
    }
    is: { visible?: boolean; enabled?: boolean; checked?: boolean }
    dialog: { open: boolean; type?: string; message?: string; defaultValue?: string }
    contexts: { contexts: ContextData[]; current?: string }
}

export type ActionData<A extends string = string> = A extends keyof ActionDataMap ? ActionDataMap[A] : unknown

export interface AgentActionResult<A extends string = string> {
    text?: string
    /**
     * the WebdriverIO code the action ran, e.g. `await $('role/button[name="Save"]').click()`
     */
    code?: string
    files?: string[]
    data?: ActionData<A>
    /**
     * what the page shows after the action, same as the "Page:" or "Changes:" text
     */
    changes?: PageChange
    /**
     * a click or tap after which the page shows no change
     */
    noVisibleChange?: boolean
    page?: PageInfo
    /**
     * load-error and bot-check notes, also appended to `text`
     */
    notes?: string[]
}

export interface AgentSnapshotOptions extends SnapshotOptions {
    /**
     * the snapshot is not returned above this size, `tooBig` is set and `text` is a summary
     */
    maxChars?: number
}

export interface AgentSnapshot extends TakenSnapshot {
    lines: number
    refs: number
    chars: number
    page?: PageInfo
    notes?: string[]
    tooBig: boolean
}
