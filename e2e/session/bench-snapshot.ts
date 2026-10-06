/**
 * Snapshot cost per page: session snapshot, top-level collect round trip,
 * in-page collector time and BiDi/classic round-trip counts. Report only,
 * not part of CI.
 *
 *   pnpm exec tsx e2e/session/bench-snapshot.ts [--n 15] [--url https://webdriver.io] [--pages index,long,frames,shadow]
 */
import fs from 'node:fs'
import path from 'node:path'
import { performance } from 'node:perf_hooks'
import { pathToFileURL } from 'node:url'

import { remote } from 'webdriverio'
import { knownRoles, roleTable } from '../../packages/wdio-utils/build/index.js'
import { collectInPage, collectWeb } from '../../packages/wdio-snapshot/build/index.js'
import { createAgentSession } from '@wdio/session/agent'

import { SITE, startServer } from './helpers.js'

const WARMUP = 3
const OUT_FILE = '/tmp/claude-1000/-home-winify-webdriverio-webdriverio/f91b11a7-5332-4396-bd7e-a00a00bc1de9/scratchpad/bench-baseline.json'
const DEVTOOLS_ELEMENTS = '/home/winify/webdriverio/devtools/packages/elements/dist/index.js'
const COUNTED = ['execute', 'executeScript', 'browsingContextGetTree', 'getWindowHandle', '$', '$$', 'findElement', 'findElements'] as const

function arg (name: string, fallback?: string) {
    const i = process.argv.indexOf(`--${name}`)
    return i > -1 ? process.argv[i + 1] : fallback
}

const N = Number(arg('n', '15'))
const extraUrl = arg('url')
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
const inPageArgs = { ...opts, roles: roleTable(), knownRoles: knownRoles(), assignRefs: true }
const inPageScript = `const t=performance.now(); (${collectInPage.toString()})(arguments[0]); return performance.now()-t`

let devtools: { getSnapshot: (b: WebdriverIO.Browser, o: Record<string, unknown>) => Promise<unknown> } | undefined
if (fs.existsSync(DEVTOOLS_ELEMENTS)) {
    devtools = await import(pathToFileURL(DEVTOOLS_ELEMENTS).href)
} else {
    console.log(`note: ${DEVTOOLS_ELEMENTS} not found, skipping devtools info rows`)
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
            const collect = await time(() => collectWeb(browser, opts, { transport: 'classic-first' }))
            const inPage = await time(async () => {
                const ms = await browser.executeScript(inPageScript, [inPageArgs]) as number
                inPageSamples.push(ms)
            })
            const roundTrips = await countRoundTrips(browser, () => agent.snapshot())
            const row: Record<string, any> = {
                total, collect, inPage: stat(inPageSamples.splice(0).slice(-N)),
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
    ['total', 'a) session snapshot'], ['collect', 'b) collect round-trip'], ['inPage', 'c) in-page collector'],
    ['frames', 'd) frames (a-b)'], ['devtoolsAll', 'info: devtools all'], ['devtoolsViewport', 'info: devtools viewport']
]
console.log(`\nn=${N}, warmup=${WARMUP}, cells are median/p90 ms`)
const colW = Math.max(24, ...Object.keys(results).map((k) => k.length + 2))
console.log(['metric'.padEnd(26), ...Object.keys(results).map((k) => k.padEnd(colW))].join(''))
for (const [key, label] of metrics) {
    if (key.startsWith('devtools') && !devtools) {
        continue
    }
    console.log([label.padEnd(26), ...Object.values(results).map((r) => (r.error ? 'error' : f(r[key])).padEnd(colW))].join(''))
}
console.log('\nround trips during one session snapshot (calls / cumulative ms; nested calls overlap)')
for (const [name, r] of Object.entries(results)) {
    console.log(`${name}: ${r.error ? r.error : Object.entries(r.roundTrips as Counts).filter(([, c]) => c.calls).map(([k, c]) => `${k}=${c.calls}/${c.ms.toFixed(0)}ms`).join('  ') || 'none'}`)
}

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
fs.writeFileSync(OUT_FILE, JSON.stringify({ n: N, warmup: WARMUP, results }, null, 2))
console.log(`\nwrote ${OUT_FILE}`)
