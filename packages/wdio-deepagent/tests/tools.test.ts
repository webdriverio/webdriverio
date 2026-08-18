import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import AdmZip from 'adm-zip'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createTraceTools } from '../src/trace/tools.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const CONFIG = path.join(FIXTURES, 'wdio.conf.ts')
const FAKE_WDIO = path.join(FIXTURES, 'fake-wdio.mjs')

async function toolText(result: unknown): Promise<string> {
    return String((result as { content?: unknown }).content ?? result)
}

function fixtureZip(): Buffer {
    const zip = new AdmZip()
    zip.addFile('trace.trace', Buffer.from([
        JSON.stringify({ type: 'before', id: 'a1', ts: 1000, action: { name: 'url', value: 'https://example.com' } }),
        JSON.stringify({ type: 'after', id: 'a1', ts: 1450 }),
    ].join('\n')))
    return zip.toBuffer()
}

describe('trace tools', () => {
    let traceDir: string

    beforeEach(async () => {
        traceDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-tools-'))
    })

    afterEach(async () => {
        await fs.rm(traceDir, { recursive: true, force: true })
    })

    it('ingest_trace parses a trace inside the trace dir', async () => {
        const tracePath = path.join(traceDir, 'trace.zip')
        await fs.writeFile(tracePath, fixtureZip())

        const [ingest] = createTraceTools({ traceDir })
        const text = await toolText(await ingest.invoke({ tracePath }))
        expect(text).toContain('"name": "url"')
        expect(text).toContain('"ok": true')
    })

    it('ingest_trace rejects a path outside the trace dir', async () => {
        const [ingest] = createTraceTools({ traceDir })
        await expect(ingest.invoke({ tracePath: path.join(os.tmpdir(), 'elsewhere.zip') }))
            .rejects.toThrow(/outside the trace directory/)
    })

    it('diff_traces rejects a trace outside the trace dir', async () => {
        const [,, diff] = createTraceTools({ traceDir })
        await expect(diff.invoke({
            oldTrace: path.join(traceDir, 'old.zip'),
            newTrace: path.join(os.tmpdir(), 'new.zip'),
        })).rejects.toThrow(/outside the trace directory/)
    })

    it('ingest_trace rejects an archive larger than the byte cap', async () => {
        const big = path.join(traceDir, 'big.zip')
        await fs.writeFile(big, '')
        // sparse truncate: full 256 MiB + 1 on disk without allocating it
        await fs.truncate(big, 256 * 1024 * 1024 + 1)

        const [ingest] = createTraceTools({ traceDir })
        await expect(ingest.invoke({ tracePath: big }))
            .rejects.toThrow(/refusing to parse untrusted archive/)
    })

    it('reproduce_spec resolves a relative spec against the project root, not the cwd', async () => {
        // cwd is the repo root, not the project root (FIXTURES): a
        // cwd-relative resolution would fail reproduceSpec's confinement check
        const tools = createTraceTools({
            configPath: CONFIG,
            traceDir,
            spawnCommand: process.execPath,
            spawnArgs: [FAKE_WDIO, 'run', 'overlay.mjs', '--spec'],
        })
        const reproduce = tools.find((t) => t.name === 'reproduce_spec')!
        const result = await reproduce.invoke({ spec: 'some.spec.js' })
        expect(await toolText(result)).toContain('"exitCode": 0')
    })

    it('reproduce_spec resolves a virtual `/`-prefixed spec against the project root', async () => {
        // the fs tools emit virtual paths rooted at the project dir; the
        // host-absolute resolve would escape the project root and fail
        const tools = createTraceTools({
            configPath: CONFIG,
            traceDir,
            spawnCommand: process.execPath,
            spawnArgs: [FAKE_WDIO, 'run', 'overlay.mjs', '--spec'],
        })
        const reproduce = tools.find((t) => t.name === 'reproduce_spec')!
        const result = await reproduce.invoke({ spec: '/some.spec.js' })
        expect(await toolText(result)).toContain('"exitCode": 0')
    })

    it('reproduce_spec still refuses an existing host path outside the project root', async () => {
        const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-outside-'))
        try {
            const evil = path.join(outside, 'some.spec.js')
            await fs.writeFile(evil, '// outside')
            const tools = createTraceTools({
                configPath: CONFIG,
                traceDir,
                spawnCommand: process.execPath,
                spawnArgs: [FAKE_WDIO, 'run', 'overlay.mjs', '--spec'],
            })
            const reproduce = tools.find((t) => t.name === 'reproduce_spec')!
            await expect(reproduce.invoke({ spec: evil })).rejects.toThrow(/outside the project root/)
        } finally {
            await fs.rm(outside, { recursive: true, force: true })
        }
    })

    it('ingest_trace accepts a virtual `/`-prefixed path and a host-absolute path under the project root', async () => {
        // traceDir must sit under the project root (cwd) for the virtual form to map
        const dir = await fs.mkdtemp(path.join(process.cwd(), 'test-results-'))
        try {
            await fs.writeFile(path.join(dir, 'x.zip'), fixtureZip())
            const virtualPath = '/' + path.relative(process.cwd(), path.join(dir, 'x.zip'))
            const [ingest] = createTraceTools({ traceDir: dir })
            expect(await toolText(await ingest.invoke({ tracePath: virtualPath })))
                .toContain('"name": "url"')
            expect(await toolText(await ingest.invoke({ tracePath: path.join(dir, 'x.zip') })))
                .toContain('"name": "url"')
        } finally {
            await fs.rm(dir, { recursive: true, force: true })
        }
    })
})
