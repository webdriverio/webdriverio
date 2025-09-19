import fs from 'node:fs'
import path from 'node:path'
import { LabelName } from 'allure-js-commons'
import { parseTestPlan as parseTestPlanCommons, includedInTestPlan as includedInTestPlanCommons } from 'allure-js-commons/sdk/reporter'
import type { TestPlanV1, TestPlanV1Test } from 'allure-js-commons/sdk'
import type { AddTestInfoEventArgs } from './types.js'
import type { WDIORuntimeMessage } from './types.js'
import { fileURLToPath } from 'node:url'

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

export type LoadedTestPlan = {
    path: string
    raw: TestPlanV1
    bySelector: Map<string, string>
    byId: Set<string>
}

type LooseArgs = { file?: string; fullTitle?: string; fullName?: string }

type MatchableArgs = LooseArgs | AddTestInfoEventArgs

const toPosixPath = (p: string): string => {
    try { if (p.startsWith('file:')) { p = fileURLToPath(p) } } catch { /* ignore */ }
    const abs = path.isAbsolute(p) ? p : path.resolve(p)
    return abs.replace(/\\/g, '/')
}

const toRelPosixPath = (p: string): string => {
    let abs = toPosixPath(p)
    const cwd = process.cwd().replace(/\\/g, '/')
    if (abs.startsWith(cwd)) { abs = abs.slice(cwd.length) }
    if (!abs.startsWith('/')) { abs = '/' + abs }
    return abs
}

const normalizeSelector = (s: string): string => s.replace(/^file:(\/\/)?/i, '').replace(/\\/g, '/').replace(/\/{2,}/g, '/')

export function loadTestPlan(): LoadedTestPlan | null {
    let base = parseTestPlanCommons()
    let usedPath = (process.env.ALLURE_TESTPLAN_PATH || '').trim()
    if (!base) {
        const candidates = [
            `${process.cwd()}/.allure/testplan.json`,
            `${process.cwd()}/testplan.json`,
        ]
        for (const p of candidates) {
            try {
                const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as TestPlanV1
                if ((raw.tests || []).length) { base = raw; usedPath = p; break }
            } catch { /* ignore */ }
        }
        if (!base) {
            console.log('[allure-testplan] no testplan found in env or default locations')
            return null
        }
    }

    const expanded: TestPlanV1Test[] = []
    for (const t of base.tests || []) {
        const rawSelector = String(t.selector ?? '').trim()
        if (!rawSelector) { continue }
        expanded.push(t)

        const hash = rawSelector.indexOf('#')
        if (hash >= 0) {
            const filePart = rawSelector.slice(0, hash)
            const titlePart = rawSelector.slice(hash + 1)
            const titleWithSpaces = titlePart.replace(/\./g, ' ').replace(/\s{2,}/g, ' ').trim()
            const fileNoLead = normalizeSelector(filePart).replace(/^\/+/, '')
            const fileWithLead = '/' + fileNoLead
            const fileBase = path.basename(fileNoLead)
            expanded.push({ ...t, selector: titlePart })
            expanded.push({ ...t, selector: titleWithSpaces })
            expanded.push({ ...t, selector: `${fileNoLead}#${titleWithSpaces}` })
            expanded.push({ ...t, selector: `${fileWithLead}#${titleWithSpaces}` })
            expanded.push({ ...t, selector: `${fileBase}#${titleWithSpaces}` })
        }
    }

    const normalizedPlan: TestPlanV1 = { version: base.version, tests: expanded }
    const bySelector = new Map<string, string>()
    const byId = new Set<string>()
    for (const t of normalizedPlan.tests || []) {
        const s = String(t.selector ?? '').trim()
        if (!s) { continue }
        const id = String(t.id)
        bySelector.set(s, id)
        bySelector.set(normalizeSelector(s), id)
        if (t.id !== undefined) { byId.add(String(t.id)) }
    }
    const sample = (normalizedPlan.tests || []).slice(0, 5).map((t) => t.selector).filter(Boolean)
    console.log('[allure-testplan] loaded', usedPath || '(env)', 'tests:', (normalizedPlan.tests || []).length, 'sample:', sample)
    return { path: process.env.ALLURE_TESTPLAN_PATH || '', raw: normalizedPlan, bySelector, byId }
}

export function applyTestPlanLabel(
    plan: LoadedTestPlan | null,
    push: (m: WDIORuntimeMessage) => void,
    args: MatchableArgs
): void {
    if (!plan) { return }
    const loose = ((): LooseArgs => {
        if ((args as AddTestInfoEventArgs)?.file && Array.isArray((args as AddTestInfoEventArgs)?.testPath)) {
            const a = args as AddTestInfoEventArgs
            return { file: a.file, fullTitle: a.testPath.map(String).join(' ') }
        }
        return args as LooseArgs
    })()
    const { file, fullTitle, fullName } = loose
    const base = fullName || fullTitle || ''
    const suiteDotTitle = (() => {
        if (!base) { return base }
        const parts = base.split(' ')
        if (parts.length < 2) { return base }
        const last = parts.pop()!
        const suite = parts.join(' ')
        return suite ? `${suite}.${last}` : last
    })()

    const candidates = [
        base,
        suiteDotTitle,
        file ? `${toRelPosixPath(file)}#${base}` : '',
        file ? `${toRelPosixPath(file)}#${suiteDotTitle}` : '',
        file ? `${toPosixPath(file)}#${base}` : '',
        file ? `${toPosixPath(file)}#${suiteDotTitle}` : '',
        file ? `${path.basename(file)}#${base}` : '',
        file ? `${path.basename(file)}#${suiteDotTitle}` : '',
    ].filter(Boolean) as string[]

    for (const c of candidates) {
        if (includedInTestPlanCommons(plan.raw, { fullName: c })) {
            const id = plan.bySelector.get(c) || plan.bySelector.get(normalizeSelector(c)) || 'selector-match'
            if (id && id !== 'selector-match') {
                push({ type: 'metadata', data: { labels: [{ name: LabelName.ALLURE_ID, value: String(id) }] } })
            }
            return
        }
    }
}

const kWrapped = Symbol('allure_mocha_wrapped')

export function installBddTestPlanFilter(plan: LoadedTestPlan): void {
    const g = globalThis as unknown as BDD
    const suiteStack: string[] = []

    const decide = (title: string): boolean => {
        const suites = [...suiteStack]
        const fullSuite = suites.join(' ')
        const leafSuite = suites[suites.length - 1] || ''
        const candidates = [
            suites.length ? `${fullSuite} ${title}` : title,
            suites.length ? `${fullSuite}.${title}` : title,
            leafSuite ? `${leafSuite} ${title}` : title,
            leafSuite ? `${leafSuite}.${title}` : title,
        ]
        for (const t of candidates) {
            if (plan.bySelector.has(t) || includedInTestPlanCommons(plan.raw, { fullName: t })) { return true }
        }
        const suffixes = candidates.map((t) => `#${t}`)
        for (const key of plan.bySelector.keys()) {
            if (suffixes.some((s) => key.endsWith(s))) { return true }
        }
        return false
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
            const allow = decide(title)

            console.log('tp-it', title, allow)
            if (!allow) {return undefined as unknown as MochaTest}
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
