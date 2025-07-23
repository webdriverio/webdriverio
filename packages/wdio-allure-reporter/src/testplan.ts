import fs from 'node:fs'
import path from 'node:path'
import { LabelName } from 'allure-js-commons'
import type { AddTestInfoEventArgs } from './types.js'
import type { WDIORuntimeMessage } from './types.js'
import { fileURLToPath } from 'node:url'

export type TestPlan = {
    version: string
    tests: Array<{ id: string | number; selector?: string }>
}

export type LoadedTestPlan = {
    path: string
    bySelector: Map<string, string>
    byId: Set<string>
}

type LooseArgs = { file?: string; fullTitle?: string; fullName?: string }
type MatchableArgs = LooseArgs | AddTestInfoEventArgs

const toPosix = (p: string): string => {
    try { if (p.startsWith('file:')) {p = fileURLToPath(p)} } catch { /* empty */ }
    const abs = path.isAbsolute(p) ? p : path.resolve(p)
    return abs.replace(/\\/g, '/')
}

const relPosix = (p: string): string => {
    let abs = toPosix(p)
    const cwd = process.cwd().replace(/\\/g, '/')
    if (abs.startsWith(cwd)) {abs = abs.slice(cwd.length)}
    if (!abs.startsWith('/')) {abs = '/' + abs}
    return abs
}
const normalize = (s: string): string =>
    s.replace(/^file:(\/\/)?/i, '').replace(/\\/g, '/').replace(/\/{2,}/g, '/')

const normalizeFullTitle = (fullTitle?: string): string | undefined => {
    if (!fullTitle) {return undefined}
    const hash = fullTitle.indexOf('#')
    if (hash < 0) {return normalize(fullTitle)}
    const left = fullTitle.slice(0, hash)
    const right = fullTitle.slice(hash + 1)
    return `${relPosix(left)}#${right}`
}

const isAddTestInfo = (a: unknown): a is AddTestInfoEventArgs =>
    !!a && typeof (a as { file?: unknown }).file === 'string' && Array.isArray((a as { testPath?: unknown }).testPath)

const toLoose = (a: MatchableArgs): LooseArgs =>
    isAddTestInfo(a) ? { file: a.file, fullTitle: a.testPath.join(' ') } : a

const selectorVariants = (file?: string, fullTitle?: string): string[] => {
    if (!file || !fullTitle) {return []}
    const abs = toPosix(file)
    const rel = relPosix(file)

    const ft = normalizeFullTitle(fullTitle)!.split('#').slice(1).join('#') || fullTitle
    const primary = `${rel}#${ft}`
    const altAbs = `${abs}#${ft}`
    const altBase = `${path.basename(abs)}#${ft}`

    return [
        primary,
        normalize(primary),
        altAbs,
        normalize(altAbs),
        altBase,
        normalize(altBase),
    ]
}

const primaryCandidates = (fullName?: string, fullTitle?: string): string[] => {
    const out: string[] = []
    if (fullName) {
        const f = normalizeFullTitle(fullName)!
        out.push(f, normalize(f))
    }
    if (fullTitle) {
        const f = normalizeFullTitle(fullTitle)!
        out.push(f, normalize(f))
    }
    return out
}

const heuristicMatch = (plan: LoadedTestPlan, fullTitle?: string): string | undefined => {
    if (!fullTitle) {return undefined}
    const ft = normalize(fullTitle)
    for (const [sel, id] of plan.bySelector.entries()) {
        if (sel.includes('#')) {continue}
        const s = normalize(sel)
        if (ft === s || ft.endsWith(' ' + s) || ft.startsWith(s + ' ')) {return id}
    }
    return undefined
}

export function loadTestPlan(): LoadedTestPlan | null {
    const candidates = [
        process.env.ALLURE_TESTPLAN_PATH ?? '',
        `${process.cwd()}/.allure/testplan.json`,
        `${process.cwd()}/testplan.json`,
    ].filter(Boolean)

    for (const p of candidates) {
        try {
            const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as TestPlan
            const bySelector = new Map<string, string>()
            const byId = new Set<string>()
            for (const t of raw.tests ?? []) {
                const sel = String(t.selector ?? '').trim()
                if (!sel) {continue}
                const id = String(t.id)
                bySelector.set(sel, id)
                bySelector.set(normalize(sel), id)
                byId.add(id)
            }
            return { path: p, bySelector, byId }
        } catch {
            /* ignore broken candidate and continue */
        }
    }
    return null
}

export function matchInPlan(plan: LoadedTestPlan | null, args: MatchableArgs): string | undefined {
    if (!plan) {return undefined}

    if (isAddTestInfo(args)) {
        const fileRel = relPosix(args.file)
        const ft = args.testPath.join(' ')
        const primary = `${fileRel}#${ft}`

        const hitPrimary = plan.bySelector.get(primary) ?? plan.bySelector.get(normalize(primary))
        if (hitPrimary) {return hitPrimary}

        const fallbackAbs = `${toPosix(args.file)}#${ft}`
        const hitAbs = plan.bySelector.get(fallbackAbs) ?? plan.bySelector.get(normalize(fallbackAbs))
        if (hitAbs) {return hitAbs}

        const fallbackBase = `${path.basename(args.file)}#${ft}`
        const hitBase = plan.bySelector.get(fallbackBase) ?? plan.bySelector.get(normalize(fallbackBase))
        if (hitBase) {return hitBase}

        return heuristicMatch(plan, ft)
    }

    const { file, fullTitle, fullName } = toLoose(args)

    for (const k of [...selectorVariants(file, fullTitle), ...primaryCandidates(fullName, fullTitle)]) {
        const hit = plan.bySelector.get(k)
        if (hit) {return hit}
    }

    return heuristicMatch(plan, fullTitle)
}

export function isInTestPlan(plan: LoadedTestPlan | null, args: MatchableArgs): boolean {
    return Boolean(matchInPlan(plan, args))
}

export function applyTestPlanLabel(
    plan: LoadedTestPlan | null,
    push: (m: WDIORuntimeMessage) => void,
    args: MatchableArgs
): void {
    const id = matchInPlan(plan, args)
    if (!id) {return}
    push({
        type: 'metadata',
        data: { labels: [{ name: LabelName.ALLURE_ID, value: String(id) }] },
    })
}

type MochaContext = unknown
type MochaSuite = unknown
type MochaTest = unknown
type MochaFunc = (this: MochaContext, done?: unknown) => unknown
type MochaAsyncFunc = (this: MochaContext) => Promise<unknown>

type MochaSuiteFunction = ((
    title: string,
    fn?: (this: MochaSuite) => void
) => MochaSuite) & {
    only?: (title: string, fn?: (this: MochaSuite) => void) => MochaSuite
    skip?: (title: string, fn?: (this: MochaSuite) => void) => MochaSuite
}

type MochaTestFunction = ((
    title: string,
    fn?: MochaFunc | MochaAsyncFunc
) => MochaTest) & {
    only?: (title: string, fn?: MochaFunc | MochaAsyncFunc) => MochaTest
    skip?: (title: string, fn?: MochaFunc | MochaAsyncFunc) => MochaTest
}

type MochaExclusiveSuiteFunction = NonNullable<MochaSuiteFunction['only']>
type MochaPendingSuiteFunction  = NonNullable<MochaSuiteFunction['skip']>
type MochaExclusiveTestFunction = NonNullable<MochaTestFunction['only']>
type MochaPendingTestFunction   = NonNullable<MochaTestFunction['skip']>

type BDD = {
    describe?: MochaSuiteFunction
    context?: MochaSuiteFunction
    it?: MochaTestFunction
    specify?: MochaTestFunction
}

const kWrapped = Symbol('allure_mocha_wrapped')

export function installBddTestPlanFilter(plan: LoadedTestPlan): void {
    const g = globalThis as unknown as BDD
    const suiteStack: string[] = []

    const decide = (title: string): boolean => {
        const prefix = suiteStack.length ? suiteStack.join(' ') + ' ' : ''
        const fullTitle = `${prefix}${title}`
        return isInTestPlan(plan, { fullTitle })
    }

    const wrapSuite = (original: MochaSuiteFunction): MochaSuiteFunction => {
        if ((original as unknown as Record<symbol, unknown>)[kWrapped]) {return original}
        const wrapped = ((title: string, fn?: (this: MochaSuite) => void) => {
            if (typeof fn !== 'function') {return original(title)}
            return original(title, function (this: MochaSuite) {
                suiteStack.push(title)
                try { fn.call(this) } finally { suiteStack.pop() }
            })
        }) as MochaSuiteFunction
        wrapped.only = original.only as MochaExclusiveSuiteFunction
        wrapped.skip = original.skip?.bind(original) as MochaPendingSuiteFunction
        Object.defineProperty(wrapped, kWrapped, { value: true })
        return wrapped
    }

    const wrapIt = (original: MochaTestFunction): MochaTestFunction => {
        if ((original as unknown as Record<symbol, unknown>)[kWrapped]) {return original}
        const wrapped = ((title: string, fn?: MochaFunc | MochaAsyncFunc) => {
            if (!decide(title)) {return undefined as unknown as MochaTest}
            return original(title, fn as MochaFunc)
        }) as MochaTestFunction
        wrapped.only = ((title: string, fn?: MochaFunc | MochaAsyncFunc) => {
            const only = original.only as MochaExclusiveTestFunction | undefined
            if (!only) {return original(title, fn as MochaFunc)}
            if (!decide(title)) {return undefined as unknown as MochaTest}
            return only(title, fn as MochaFunc)
        }) as MochaExclusiveTestFunction
        wrapped.skip = original.skip?.bind(original) as MochaPendingTestFunction
        Object.defineProperty(wrapped, kWrapped, { value: true })
        return wrapped
    }

    const install = <K extends keyof BDD>(name: K, kind: 'suite' | 'test') => {
        const current = g[name]
        const apply = kind === 'suite' ? wrapSuite : wrapIt

        if (typeof current === 'function') {
            ;(g as Record<string, unknown>)[name as string] = apply(current as never)
            return
        }

        Object.defineProperty(g, name, {
            configurable: true,
            enumerable: true,
            get() { return undefined },
            set(v: unknown) {
                const wrapped = typeof v === 'function' ? apply(v as never) : v
                Object.defineProperty(g, name, {
                    value: wrapped,
                    writable: true,
                    configurable: true,
                    enumerable: true,
                })
            },
        })
    }

    install('describe', 'suite')
    install('context',  'suite')
    install('it',       'test')
    install('specify',  'test')
}
