/**
 * Snapshot cost per page: session snapshot, top-level collect round trip,
 * in-page collector time and BiDi/classic round-trip counts. Report only,
 * not part of CI.
 *
 *   pnpm exec tsx e2e/session/bench-snapshot.ts [--n 15] [--url https://webdriver.io] [--pages index,long,frames,shadow]
 *     [--out results.json] [--devtools ../devtools/packages/elements/dist/index.js]
 */
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

import { remote } from 'webdriverio'
import { collectScript, collectWeb } from '../../packages/wdio-snapshot/build/index.js'
import { createAgentSession } from '@wdio/session/agent'

import { SITE, startServer } from './helpers.js'

const WARMUP = 3
const COUNTED = ['execute', 'executeScript', 'browsingContextGetTree', 'getWindowHandle', '$', '$$', 'findElement', 'findElements'] as const

function arg (name: string, fallback?: string) {
    const i = process.argv.indexOf(`--${name}`)
    return i > -1 ? process.argv[i + 1] : fallback
}

const N = Number(arg('n', '15'))
const extraUrl = arg('url')
const OUT_FILE = arg('out')
const DEVTOOLS_ELEMENTS = arg('devtools')
const pageNames = arg('pages', 'index,long,frames,shadow')!.split(',').filter((p) => fs.existsSync(path.join(SITE, `${p}.html`)))

function pct (values: number[], p: number) {
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))]
}
const stat = (values: number[]) => ({ median: pct(values, 0.5), p90: pct(values, 0.9) })

async function time (fn: () => Promise<unknown>) {
    for (let i = 0; i < WARMUP; i++) {
        await fn()
    }
    const samples: number[] = []
    for (let i = 0; i < N; i++) {
        const start = performance.now()
        await fn()
        samples.push(performance.now() - start)
    }
    return stat(samples)
}

type Counts = Record<string, { calls: number, ms: number }>

async function countRoundTrips (browser: WebdriverIO.Browser, fn: () => Promise<unknown>) {
    const counts: Counts = {}
    const target = browser as unknown as Record<string, (...a: unknown[]) => Promise<unknown>>
    const originals = new Map<string, PropertyDescriptor>()
    for (const name of COUNTED) {
        const descriptor = Object.getOwnPropertyDescriptor(browser, name)
        if (typeof target[name] !== 'function' || !descriptor?.configurable) {
            continue
        }
        const original = target[name]
        originals.set(name, descriptor)
        counts[name] = { calls: 0, ms: 0 }
        const wrapped = async function (this: unknown, ...a: unknown[]) {
            const start = performance.now()
            counts[name].calls++
            try {
                return await original.apply(this ?? browser, a)
            } finally {
                counts[name].ms += performance.now() - start
            }
        }
        Object.defineProperty(browser, name, { configurable: true, enumerable: descriptor.enumerable, writable: true, value: wrapped })
    }
    try {
        await fn()
    } finally {
        for (const [name, descriptor] of originals) {
            Object.defineProperty(browser, name, descriptor)
        }
    }
    return counts
}

const server = await startServer()
const browser = await remote({
    logLevel: 'error',
    capabilities: {
        browserName: 'chrome',
        webSocketUrl: true,
        'goog:chromeOptions': { args: ['headless', 'disable-gpu'] }
    }
})
const agent = await createAgentSession(browser)

const opts = { counter: 0, all: false, boxes: false, urls: false }
const inPageArgs = { ...opts, assignRefs: true as const }
const inPageScript = (extendedCandidates?: boolean) => `const t=performance.now(); ${collectScript({ ...inPageArgs, extendedCandidates })}; return performance.now()-t`

let devtools: { getSnapshot: (b: WebdriverIO.Browser, o: Record<string, unknown>) => Promise<unknown> } | undefined
if (DEVTOOLS_ELEMENTS && fs.existsSync(DEVTOOLS_ELEMENTS)) {
    devtools = await import(pathToFileURL(DEVTOOLS_ELEMENTS).href)
} else {
    console.log('note: pass --devtools <path to @wdio/elements dist/index.js> for the devtools info rows')
}

const targets = [
    ...pageNames.map((p) => ({ name: p, url: `${server.url}/${p}.html` })),
    ...(extraUrl ? [{ name: extraUrl, url: extraUrl }] : [])
]
const inPageSamples: number[] = []
const results: Record<string, any> = {}

try {
    for (const target of targets) {
        try {
            await browser.url(target.url)
            await browser.pause(300)
            const total = await time(() => agent.snapshot())
            const totalViewport = await time(() => agent.snapshot({ viewport: true }))
            const collect = await time(() => collectWeb(browser, opts, { transport: 'classic-first' }))
            const collectExtended = await time(() => collectWeb(browser, { ...opts, extendedCandidates: true }, { transport: 'classic-first' }))
            const inPage = await time(async () => {
                const ms = await browser.executeScript(inPageScript(), []) as number
                inPageSamples.push(ms)
            })
            const inPageExtendedSamples: number[] = []
            await time(async () => {
                inPageExtendedSamples.push(await browser.executeScript(inPageScript(true), []) as number)
            })
            const roundTrips = await countRoundTrips(browser, () => agent.snapshot())
            const row: Record<string, any> = {
                total, totalViewport, collect, collectExtended, inPage: stat(inPageSamples.splice(0).slice(-N)), inPageExtended: stat(inPageExtendedSamples.slice(-N)),
                frames: { median: total.median - collect.median, p90: total.p90 - collect.p90 },
                roundTrips
            }
            void inPage
            if (devtools) {
                row.devtoolsAll = await time(() => devtools!.getSnapshot(browser, { inViewportOnly: false }))
                row.devtoolsViewport = await time(() => devtools!.getSnapshot(browser, { inViewportOnly: true }))
            }
            results[target.name] = row
        } catch (err) {
            results[target.name] = { error: String(err) }
        }
    }
} finally {
    await agent.dispose()
    await browser.deleteSession()
    await server.close()
}

const f = (v?: { median: number, p90: number }) => v ? `${v.median.toFixed(1)}/${v.p90.toFixed(1)}` : '-'
const metrics: [string, string][] = [
    ['total', 'a) session snapshot'], ['totalViewport', 'a2) session snapshot --viewport'], ['collect', 'b) collect round-trip'], ['collectExtended', 'b2) collect extended candidates'], ['inPage', 'c) in-page collector'], ['inPageExtended', 'c2) in-page, extended candidates'],
    ['frames', 'd) frames (a-b)'], ['devtoolsAll', 'info: devtools all'], ['devtoolsViewport', 'info: devtools viewport']
]
console.log(`\nn=${N}, warmup=${WARMUP}, cells are median/p90 ms`)
const colW = Math.max(32, ...Object.keys(results).map((k) => k.length + 2))
console.log(['metric'.padEnd(34), ...Object.keys(results).map((k) => k.padEnd(colW))].join(''))
for (const [key, label] of metrics) {
    if (key.startsWith('devtools') && !devtools) {
        continue
    }
    console.log([label.padEnd(34), ...Object.values(results).map((r) => (r.error ? 'error' : f(r[key])).padEnd(colW))].join(''))
}
console.log('\nround trips during one session snapshot (calls / cumulative ms; nested calls overlap)')
for (const [name, r] of Object.entries(results)) {
    console.log(`${name}: ${r.error ? r.error : Object.entries(r.roundTrips as Counts).filter(([, c]) => c.calls).map(([k, c]) => `${k}=${c.calls}/${c.ms.toFixed(0)}ms`).join('  ') || 'none'}`)
}

if (OUT_FILE) {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
    fs.writeFileSync(OUT_FILE, JSON.stringify({ n: N, warmup: WARMUP, results }, null, 2))
    console.log(`\nwrote ${OUT_FILE}`)
}
