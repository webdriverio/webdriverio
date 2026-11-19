import type {} from 'webdriverio'

import { knownRoles, roleTable } from '@wdio/utils'

import type { SerializedSelectorProvider } from './providers.js'
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

const providersLiterals = new Map<string, string>()

const METHOD_SHORTHAND = /^(async\s+)?([A-Za-z_$][\w$]*)\s*\(/
const NOT_METHOD_NAMES = new Set(['async', 'function'])

/** method shorthand (`candidates(el) {…}`) is not an expression on its own: it needs an object to live in */
export function functionExpression (src: string): string {
    const method = METHOD_SHORTHAND.exec(src)
    return method && !NOT_METHOD_NAMES.has(method[2]) ? `({${src}}).${method[2]}` : `(${src})`
}

function providersLiteral (providers: SerializedSelectorProvider[]): string {
    const key = JSON.stringify(providers.map((p) => [p.name, p.candidates, !!p.locator]))
    let literal = providersLiterals.get(key)
    if (literal === undefined) {
        const entries = providers.filter((p) => p.candidates).map((p) => `{name:${JSON.stringify(p.name)},fn:${functionExpression(p.candidates!)}${p.locator ? ',locator:true' : ''}}`)
        literal = `[${entries.join(',')}]`
        providersLiterals.set(key, literal)
    }
    return literal
}

function collectCall (providers: SerializedSelectorProvider[], opts: string, scope: string): string {
    return `(${collectInPage.toString()})(${opts}, ${scope}, ${providersLiteral(providers)})`
}

function providerAttributes (providers: SerializedSelectorProvider[] = []): CollectOptions['providerAttributes'] {
    const list = providers.flatMap((p) => (p.attributes ?? []).map((attr) => ({ name: p.name, attr })))
    return list.length ? list : undefined
}

function classicScript (providers?: SerializedSelectorProvider[]): string {
    return providers?.length ? `return ${collectCall(providers, 'arguments[0]', 'undefined')}` : COLLECT_SCRIPT
}

function bidiScript (providers?: SerializedSelectorProvider[]): string {
    return providers?.length ? `return ${collectCall(providers, 'JSON.parse(arguments[0])', 'arguments[1]')}` : COLLECT_BIDI_SCRIPT
}

/**
 * The collector as one self-contained expression for any page-eval API
 * (`page.evaluate`, `Runtime.evaluate`): it evaluates to a `CollectResult`.
 * The role table travels inside the script, as one JSON literal parsed in the page.
 */
export function collectScript (opts: Omit<CollectOptions, 'roles' | 'knownRoles'>, providers?: SerializedSelectorProvider[]): string {
    const json = JSON.stringify({ ...opts, providerAttributes: providerAttributes(providers), roles: roleTable(), knownRoles: knownRoles() })
    const arg = `JSON.parse(${JSON.stringify(json)})`
    return providers?.length ? collectCall(providers, arg, 'undefined') : `(${collectInPage.toString()})(${arg})`
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
export async function collectWeb (context: WebdriverIO.Browser, opts: Omit<CollectOptions, 'roles' | 'assignRefs' | 'providerAttributes'> & { assignRefs?: CollectOptions['assignRefs'] }, how: CollectHow, providers?: SerializedSelectorProvider[]): Promise<CollectWebResult> {
    const assignRefs = opts.assignRefs ?? true
    const withProviders = { ...opts, providerAttributes: providerAttributes(providers) }
    const bidi = () => {
        const json = `${JSON.stringify({ ...withProviders, assignRefs }).slice(0, -1)},${rolesAsJson()}}`
        return context.execute(bidiScript(providers), json, ...(how.scope ? [how.scope as unknown as Element] : [])) as Promise<CollectResult>
    }
    if (how.scope) {
        return bidi()
    }
    if (how.transport === 'classic-first') {
        try {
            const args: CollectOptions = { ...withProviders, roles: roleTable(), knownRoles: knownRoles(), assignRefs }
            return await context.executeScript(classicScript(providers), [args]) as CollectResult
        } catch {
            // a driver without the classic endpoint in BiDi sessions: stay on BiDi
            return { ...await bidi(), classicUnavailable: true }
        }
    }
    return bidi()
}
