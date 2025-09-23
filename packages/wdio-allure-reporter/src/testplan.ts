import path from 'node:path'
//
import { includedInTestPlan, parseTestPlan } from 'allure-js-commons/sdk/reporter'
import type { TestPlanV1 } from 'allure-js-commons/sdk'
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

export function applyTestPlanLabel(
    plan: TestPlanV1 | undefined,
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
        if (includedInTestPlan(plan, { fullName: c })) { return }
    }
}

const kWrapped = Symbol('allure_mocha_wrapped')

export function installBddTestPlanFilter(plan: TestPlanV1): void {
    const globalBdd = globalThis as unknown as BDD
    const suiteStack: string[] = []

    const decide = (title: string): boolean => {
        const suites = [...suiteStack]
        const fullSuiteTitle = suites.join(' ')
        const leafSuite = suites[suites.length - 1] || ''
        const titleCandidates = [
            suites.length ? `${fullSuiteTitle} ${title}` : title,
            suites.length ? `${fullSuiteTitle}.${title}` : title,
            leafSuite ? `${leafSuite} ${title}` : title,
            leafSuite ? `${leafSuite}.${title}` : title,
        ]

        const detectCurrentFile = (): string | undefined => {
            const st = String((new Error()).stack || '')
            const lines = st.split('\n').map((l) => l.trim())
            const cwd = process.cwd().replace(/\\/g, '/')
            for (const ln of lines) {
                const m = ln.match(/(?:\(|\s)(file:\/\/[^):]+|[A-Za-z]:[^):]+|\/[^^):]+):\d+:\d+\)?$/)
                let p = (m?.[1] || '').trim()
                if (!p) {continue}
                p = p.split('?')[0]
                p = toPosixPath(p)
                if (!/\.(?:m?js|c?ts)$/i.test(p)) { continue }
                if (p.includes('node_modules')) { continue }
                if (p.includes('wdio-allure-reporter')) { continue }
                if (!p.startsWith(cwd) && !p.startsWith('/test/')) { continue }
                return p
            }
            return undefined
        }

        const file = detectCurrentFile()
        const fileVariants: string[] = []
        if (file) {
            const absolutePath = toPosixPath(file)
            const relativeWithSlash = toRelPosixPath(file)
            const relativeNoSlash = relativeWithSlash.startsWith('/') ? relativeWithSlash.slice(1) : relativeWithSlash
            const baseName = path.basename(absolutePath)
            fileVariants.push(absolutePath, relativeWithSlash, relativeNoSlash, baseName)
        }

        const withFiles: string[] = []
        for (const candidateTitle of titleCandidates) {
            withFiles.push(candidateTitle)
            for (const variant of fileVariants) {
                withFiles.push(`${variant}#${candidateTitle}`)
            }
        }
        const candidates = withFiles
        for (const t of candidates) {
            if (includedInTestPlan(plan, { fullName: t })) { return true }
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
        const current = globalBdd[name]
        const apply = kind === 'suite' ? wrapSuite : wrapIt

        if (typeof current === 'function') {
            ;(globalBdd as Record<string, unknown>)[name as string] = apply(current as never)
            return
        }

        Object.defineProperty(globalBdd, name, {
            configurable: true,
            enumerable: true,
            get() { return undefined },
            set(v: unknown) {
                const wrapped = typeof v === 'function' ? apply(v as never) : v
                Object.defineProperty(globalBdd, name, {
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

function autoInstallMochaFilter(): void {
    const envPlan = process.env.ALLURE_TESTPLAN_PATH
    const isMocha = String(process.env.WDIO_FRAMEWORK || '').toLowerCase().includes('mocha')
    if (!envPlan || envPlan === 'undefined' || envPlan === 'null' || !isMocha) { return }
    const plan = parseTestPlan()
    if (plan) { installBddTestPlanFilter(plan) }
}

autoInstallMochaFilter()
