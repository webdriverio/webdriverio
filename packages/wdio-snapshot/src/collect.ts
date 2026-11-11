import type {} from 'webdriverio'

import { knownRoles, roleTable } from '@wdio/utils'

import { collectInPage, type CollectOptions, type CollectResult } from './web.js'

/**
 * The collector as a classic WebDriver script. Built once: it is sent with
 * every snapshot.
 */
const COLLECT_SCRIPT = `return (${collectInPage.toString()})(arguments[0])`

export interface CollectHow {
    /**
     * element to collect under, instead of the whole document
     */
    scope?: WebdriverIO.Element
    /**
     * `classic-first` sends the collector through the classic `executeScript`
     * endpoint and falls back to `execute`; `bidi` uses `execute` only
     */
    transport: 'classic-first' | 'bidi'
}

export interface CollectWebResult extends CollectResult {
    /**
     * the classic endpoint failed, so callers should use `bidi` from now on
     */
    classicUnavailable?: boolean
}

/**
 * The same collector as a function body for BiDi `execute`. The options arrive
 * as one JSON string, the scope element as a real argument.
 */
const COLLECT_BIDI_SCRIPT = `return (${collectInPage.toString()})(JSON.parse(arguments[0]), arguments[1])`

/**
 * The collector as one self-contained expression for any page-eval API
 * (`page.evaluate`, `Runtime.evaluate`): it evaluates to a `CollectResult`.
 * The role table travels inside the script, as one JSON literal parsed in the page.
 */
export function collectScript (opts: Omit<CollectOptions, 'roles' | 'knownRoles'>): string {
    const json = JSON.stringify({ ...opts, roles: roleTable(), knownRoles: knownRoles() })
    return `(${collectInPage.toString()})(JSON.parse(${JSON.stringify(json)}))`
}

let rolesFragment: string | undefined
/** `"roles":…,"knownRoles":…`, stringified once per process */
const rolesAsJson = () => rolesFragment ??= `"roles":${JSON.stringify(roleTable())},"knownRoles":${JSON.stringify(knownRoles())}`

/**
 * Run the snapshot collector in the page. `web.ts` only holds code that runs
 * in the browser, the role table comes from here.
 *
 * BiDi `execute` deserializes nested-object arguments slowly (the role table
 * cost ~600 ms per call), so options travel as one JSON string. The classic
 * `executeScript` endpoint takes plain JSON directly, so the top-level
 * document uses it. Frames and other tabs the session holds as BiDi browsing
 * contexts keep using `execute`, which targets them.
 */
export async function collectWeb (context: WebdriverIO.Browser, opts: Omit<CollectOptions, 'roles' | 'assignRefs'> & { assignRefs?: CollectOptions['assignRefs'] }, how: CollectHow): Promise<CollectWebResult> {
    const assignRefs = opts.assignRefs ?? true
    const bidi = () => {
        const json = `${JSON.stringify({ ...opts, assignRefs }).slice(0, -1)},${rolesAsJson()}}`
        return context.execute(COLLECT_BIDI_SCRIPT, json, ...(how.scope ? [how.scope as unknown as Element] : [])) as Promise<CollectResult>
    }
    if (how.scope) {
        return bidi()
    }
    if (how.transport === 'classic-first') {
        try {
            const args: CollectOptions = { ...opts, roles: roleTable(), knownRoles: knownRoles(), assignRefs }
            return await context.executeScript(COLLECT_SCRIPT, [args]) as ReturnType<typeof collectInPage>
        } catch {
            // a driver without the classic endpoint in BiDi sessions: stay on BiDi
            return { ...await bidi(), classicUnavailable: true }
        }
    }
    return bidi()
}
