import path from 'node:path'
import url from 'node:url'
import vm from 'node:vm'
import util from 'node:util'
import module from 'node:module'

import { resolveOptionalDependency } from '@wdio/utils/node'
import { expect, setDefaultOptions } from 'expect-webdriverio'

import { IMPORT_FN } from './transform.js'
import type { Session } from '../session.js'
import { scopeOf } from '../snapshot/target.js'

export type ConsoleSink = (line: string) => void

export interface ExecContext {
    context: vm.Context
    /**
     * route `console` output of the running call
     */
    setSink: (sink: ConsoleSink) => void
    /**
     * base directory for relative imports of the running call
     */
    setBaseDir: (dir: string) => void
    /**
     * refs resolved by the running call, reset per call
     */
    usedRefs: Map<string, WebdriverIO.Element>
}

const CONTEXT_KEY = 'exec:context'

/**
 * `ref('e3')` returns a thenable that also forwards element commands, so
 * both `await ref('e3')` and `await ref('e3').click()` work.
 */
function chainable (promise: Promise<WebdriverIO.Element>) {
    return new Proxy(promise, {
        get (target, prop) {
            if (prop === 'then' || prop === 'catch' || prop === 'finally') {
                return (target[prop] as (...args: unknown[]) => unknown).bind(target)
            }
            return (...args: unknown[]) => target.then((el) => {
                const fn = (el as unknown as Record<string | symbol, unknown>)[prop]
                if (typeof fn !== 'function') {
                    throw new TypeError(`ref(...).${String(prop)} is not a function`)
                }
                return (fn as (...a: unknown[]) => unknown).apply(el, args)
            })
        }
    })
}

async function importFrom (baseDir: string, specifier: string) {
    if (specifier.startsWith('node:') || module.isBuiltin(specifier)) {
        return import(specifier)
    }
    if (specifier.startsWith('.') || path.isAbsolute(specifier)) {
        return import(url.pathToFileURL(path.resolve(baseDir, specifier)).href)
    }
    if (specifier.startsWith('file:')) {
        return import(specifier)
    }
    const resolved = await resolveOptionalDependency(specifier, { cwd: baseDir, from: import.meta.url })
    if (!resolved) {
        throw new Error(`Cannot find package '${specifier}' from ${baseDir}`)
    }
    return import(url.pathToFileURL(resolved).href)
}

/**
 * The context `exec` code runs in (RFC §7.3). Created once per session so
 * variables persist across calls.
 */
export async function getExecContext (session: Session): Promise<ExecContext> {
    const existing = session.get<ExecContext>(CONTEXT_KEY)
    if (existing) {
        return existing
    }
    const waitforTimeout = (session.browser.options as { waitforTimeout?: number }).waitforTimeout
    if (waitforTimeout) {
        setDefaultOptions({ wait: waitforTimeout })
    }
    /**
     * some matchers read the global browser object
     */
    const g = globalThis as Record<string, unknown>
    g.browser ??= session.browser
    g.driver ??= session.browser

    let sink: ConsoleSink = () => {}
    let baseDir = session.cwd
    const usedRefs = new Map<string, WebdriverIO.Element>()
    const write = (prefix: string) => (...args: unknown[]) => {
        const text = util.formatWithOptions({ colors: false, depth: 4 }, ...args)
        for (const line of text.split('\n')) {
            sink(prefix + line)
        }
    }
    const capturedConsole = {
        log: write(''),
        info: write(''),
        debug: write(''),
        trace: write(''),
        dir: (obj: unknown) => write('')(util.inspect(obj, { depth: 4 })),
        table: (data: unknown) => write('')(util.inspect(data, { depth: 4 })),
        warn: write('warn: '),
        error: write('error: ')
    }
    const ref = (id: string) => chainable((async () => {
        const el = await session.refs.resolve(scopeOf(session), String(id))
        usedRefs.set(String(id), el)
        return el
    })())

    const globals: Record<string, unknown> = {
        browser: session.browser,
        driver: session.browser,
        $: (...args: Parameters<WebdriverIO.Browser['$']>) => session.browser.$(...args),
        $$: (...args: Parameters<WebdriverIO.Browser['$$']>) => session.browser.$$(...args),
        expect,
        ref,
        session: {
            name: session.name,
            artifactsDir: session.artifactsDir,
            log: write(''),
            snapshot: async (opts: Record<string, unknown> = {}) => {
                const result = await session.dispatch({ action: 'snapshot', args: { ...opts, maxChars: Number.MAX_SAFE_INTEGER, $internal: true }, cwd: session.cwd })
                return (result.data as { snapshot?: string })?.snapshot ?? result.text
            }
        },
        console: capturedConsole,
        [IMPORT_FN]: (specifier: string) => importFrom(baseDir, specifier),
        process,
        setTimeout,
        clearTimeout,
        setInterval,
        clearInterval,
        setImmediate,
        clearImmediate,
        queueMicrotask,
        structuredClone,
        fetch,
        Headers,
        Request,
        Response,
        FormData,
        URL,
        URLSearchParams,
        Buffer,
        TextEncoder,
        TextDecoder,
        AbortController,
        AbortSignal,
        atob,
        btoa,
        performance,
        crypto: globalThis.crypto
    }
    const context = vm.createContext(globals, { name: `wdio session ${session.name}` })
    const ctx: ExecContext = {
        context,
        setSink: (fn) => (sink = fn),
        setBaseDir: (dir) => (baseDir = dir),
        usedRefs
    }
    session.set(CONTEXT_KEY, ctx)
    return ctx
}
