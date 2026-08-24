import { describe, expect, it } from 'vitest'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRunSpecTool } from '../src/run-spec.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const CONFIG = path.join(FIXTURES, 'wdio.conf.ts')

async function toolText(result: unknown): Promise<string> {
    return String((result as { content?: unknown }).content ?? result)
}

describe('run_spec tool', () => {
    it('runs a spec and returns exit code, duration and the stdout tail', async () => {
        const tool = createRunSpecTool({
            configPath: CONFIG,
            spawnCommand: process.execPath,
            spawnArgs: ['-e', 'console.log("spec ran")'],
        })
        const text = await toolText(await tool.invoke({ spec: 'some.spec.js' }))
        expect(text).toContain('"exitCode": 0')
        expect(text).toContain('"stdoutTail": "spec ran')
        expect(text).toMatch(/"durationMs": \d/)
    })

    it('resolves a virtual `/`-prefixed and a relative spec against the project root', async () => {
        const tool = createRunSpecTool({
            configPath: CONFIG,
            spawnCommand: process.execPath,
            spawnArgs: ['-e', 'console.log("ran")'],
        })
        // either form must resolve inside the project root, or runSpec's
        // confinement check rejects the invocation
        for (const spec of ['/some.spec.js', 'some.spec.js']) {
            const text = await toolText(await tool.invoke({ spec }))
            expect(text).toContain('"exitCode": 0')
        }
    })

    it('rejects a spec that resolves outside the project root', async () => {
        const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'deepagent-outside-'))
        try {
            const evil = path.join(outside, 'some.spec.js')
            await fs.writeFile(evil, '// outside')
            const tool = createRunSpecTool({
                configPath: CONFIG,
                spawnCommand: process.execPath,
                spawnArgs: ['-e', ''],
            })
            await expect(tool.invoke({ spec: evil })).rejects.toThrow(/outside the project root/)
        } finally {
            await fs.rm(outside, { recursive: true, force: true })
        }
    })

    it('kills a hung run when the timeoutMs override is set and reports exit 124', async () => {
        const tool = createRunSpecTool({
            configPath: CONFIG,
            spawnCommand: process.execPath,
            spawnArgs: ['-e', 'setTimeout(() => {}, 120000)'],
        })
        const started = Date.now()
        const text = await toolText(await tool.invoke({ spec: 'some.spec.js', timeoutMs: 250 }))
        expect(text).toContain('"exitCode": 124')
        expect(text).toContain('timed out after 250 ms')
        // resolved promptly, not after the child's 2-minute sleep
        expect(Date.now() - started).toBeLessThan(10_000)
    })

    it('returns a friendly message without a configured wdio.conf', async () => {
        const tool = createRunSpecTool({})
        const text = await toolText(await tool.invoke({ spec: 'some.spec.js' }))
        expect(text).toBe('No wdio.conf configured — cannot run specs.')
    })
})
