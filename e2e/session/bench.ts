/**
 * Client overhead of `wdio session exec` versus `browser.execute` in the
 * same session. Not part of CI (`e2e/vitest.config.ts` only includes
 * `*.test.ts`).
 *
 *   pnpm exec tsx e2e/session/bench.ts
 *
 * Both sides call `browser.execute('return 1')`. The client samples pay
 * the session round trip; the baseline runs inside one `exec`. Exits 1
 * when the median client round trip is more than 50 ms above the median
 * in-session execute.
 */
import { performance } from 'node:perf_hooks'

import { send } from '../../packages/wdio-session/src/cli/client.js'
import { createProject, startServer } from './helpers.js'

const SAMPLES = 50
const WARMUP = 5

function median (values: number[]) {
    const sorted = [...values].sort((a, b) => a - b)
    return sorted[Math.floor(sorted.length / 2)]
}

const rawScript = `
const samples = []
for (let i = 0; i < ${SAMPLES}; i++) {
    const start = performance.now()
    await browser.execute('return 1')
    samples.push(performance.now() - start)
}
samples.sort((a, b) => a - b)
return samples[${Math.floor(SAMPLES / 2)}]
`

const server = await startServer()
const project = createProject('bench')
const opts = { runtimeDir: project.runtimeDir, cwd: project.dir, timeout: 60_000 }

try {
    const opened = await project.run(['open', 'chrome', server.url])
    if (opened.code !== 0) {
        throw new Error(`open failed\n${opened.stdout}\n${opened.stderr}`)
    }

    for (let i = 0; i < WARMUP; i++) {
        await send('default', 'exec', { code: 'await browser.execute(\'return 1\')', history: false }, opts)
    }

    const client: number[] = []
    for (let i = 0; i < SAMPLES; i++) {
        const start = performance.now()
        const result = await send('default', 'exec', { code: 'await browser.execute(\'return 1\')', history: false }, opts)
        client.push(performance.now() - start)
        if (!result.text?.includes('1')) {
            throw new Error(`exec did not return 1: ${JSON.stringify(result)}`)
        }
    }

    const raw = await send('default', 'exec', { code: rawScript, history: false }, opts)
    const rawMedian = Number(raw.text)
    if (!Number.isFinite(rawMedian)) {
        throw new Error(`raw median was not a number: ${JSON.stringify(raw)}`)
    }
    const clientMedian = median(client)
    const overhead = clientMedian - rawMedian
    const report = {
        samples: SAMPLES,
        clientMedianMs: Number(clientMedian.toFixed(2)),
        rawMedianMs: Number(rawMedian.toFixed(2)),
        overheadMs: Number(overhead.toFixed(2))
    }
    console.log(JSON.stringify(report))
    if (overhead > 50) {
        process.exitCode = 1
    }
} finally {
    await project.cleanup()
    await server.close()
}
