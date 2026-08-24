import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import type * as childProcess from 'node:child_process'
import { WdioMcpClient, resolveLocalMcpBin, resolveMcpSpawn, useChromeLockPath, walkAncestry } from '../src/mcp/index.js'

// wrap execFile (not spawn — the MCP server transport needs the real one)
// so the chrome-cleanup sweep's pgrep invocation is observable
vi.mock('node:child_process', async (importOriginal) => {
    const actual = await importOriginal<typeof childProcess>()
    return { ...actual, execFile: vi.fn(actual.execFile) }
})

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const MCP_SERVER = path.join(FIXTURES, 'mcp-server.mjs')

describe('resolveLocalMcpBin / resolveMcpSpawn', () => {
    it('resolves the locally installed @wdio/mcp binary', () => {
        const bin = resolveLocalMcpBin()
        expect(bin).toBeDefined()
        expect(fs.existsSync(bin!)).toBe(true)
        // must point into the @wdio/mcp package, not npx
        expect(bin).toMatch(/@wdio[\\/]mcp/)
        expect(bin).not.toContain('npx')
    })

    it('prefers the local binary over the npx default and drops the npx args', () => {
        const { command, args } = resolveMcpSpawn({ command: 'npx', args: ['-y', '@wdio/mcp'] })
        expect(command).not.toBe('npx')
        expect(args).toEqual([])
    })

    it('honors an explicit user-provided command as-is', () => {
        const { command, args } = resolveMcpSpawn({ command: '/custom/bin', args: ['--flag'] })
        expect(command).toBe('/custom/bin')
        expect(args).toEqual(['--flag'])
    })

    it('keeps npx + custom args (non-default) instead of swapping to the local bin', () => {
        const { command, args } = resolveMcpSpawn({ command: 'npx', args: ['--flag'] })
        expect(command).toBe('npx')
        expect(args).toEqual(['--flag'])
    })
})

describe('WdioMcpClient (integration over stdio)', () => {
    it('loads tools from a spawned MCP server and closes cleanly', async () => {
        const client = new WdioMcpClient({ command: process.execPath, args: [MCP_SERVER] })

        const tools = await client.getTools()
        expect(client.toolCount).toBeGreaterThanOrEqual(2)
        const names = tools.map((t) => t.name)
        expect(names).toContain('fixture_navigate')
        expect(names).toContain('fixture_click')

        // second call is served from cache (no second spawn)
        const again = await client.getTools()
        expect(again).toBe(tools)

        // tool actually invocable over the wire
        const nav = tools.find((t) => t.name === 'fixture_navigate')
        const res = await nav!.invoke({ url: 'https://example.com' })
        expect(String(res)).toContain('fixture ok')

        await client.close()
        expect(client.toolCount).toBe(0)
    })

    it('restarts the server after close', async () => {
        const client = new WdioMcpClient({ command: process.execPath, args: [MCP_SERVER] })
        await client.getTools()
        await client.close()
        const tools = await client.getTools()
        expect(tools.length).toBeGreaterThanOrEqual(2)
        await client.close()
    })
})

describe('chrome ownership ancestry', () => {
    // /proc ancestry is Linux-only; macOS/Windows skip the sweep entirely
    it.skipIf(process.platform === 'win32' || process.platform === 'darwin')('walkAncestry finds the current process under init', () => {
        expect(walkAncestry(process.pid, 1).descendant).toBe(true)
    })

    it.skipIf(process.platform === 'win32' || process.platform === 'darwin')('walkAncestry rejects a non-ancestor', () => {
        expect(walkAncestry(1, process.pid).descendant).toBe(false)
    })
})

describe('chrome cleanup pgrep invocation', () => {
    // isolated lock path per test: parallel workers share os.tmpdir() and
    // would otherwise claim/release the real profile lock concurrently
    let lockDir: string
    let lockPath: string
    const pgrepCalls = () => vi.mocked(execFile).mock.calls.filter((call) => call[0] === 'pgrep')
    const holderPids = () => fs.readdirSync(lockPath).map(Number)

    beforeEach(() => {
        vi.mocked(execFile).mockClear()
        lockDir = fs.mkdtempSync(path.join(os.tmpdir(), 'deepagent-lock-'))
        lockPath = path.join(lockDir, 'chrome-debug.lock')
        useChromeLockPath(lockPath)
    })

    afterEach(() => {
        fs.rmSync(lockDir, { recursive: true, force: true })
    })

    it('calls pgrep -f via execFile with args, never a shell string', async () => {
        const client = new WdioMcpClient({ command: process.execPath, args: [MCP_SERVER] })
        try {
            await client.getTools()
        } finally {
            await client.close()
        }
        const pgrepCall = pgrepCalls()[0]
        expect(pgrepCall).toBeDefined()
        // args passed as an array is the no-shell guarantee: execFile never
        // interpolates into a shell command line
        const args = pgrepCall[1] as string[]
        expect(args).toHaveLength(2)
        expect(args[0]).toBe('-f')
        // same bracketed pattern the pre-fix shell form passed to pgrep
        expect(args[1]).toMatch(/^\[u\]ser-data-dir=/)
        expect(args[1]).toContain('chrome-debug')
    })

    it('skips the sweep while another mission holds the shared profile', async () => {
        const first = new WdioMcpClient({ command: process.execPath, args: [MCP_SERVER] })
        const second = new WdioMcpClient({ command: process.execPath, args: [MCP_SERVER] })
        try {
            await first.getTools()
            await second.getTools()
            // lock holds both server pids, one file each
            expect(holderPids()).toHaveLength(2)
            await first.close()
            // first exit must not sweep: the second mission still owns Chrome
            expect(pgrepCalls()).toHaveLength(0)
            expect(holderPids()).toHaveLength(1)
        } finally {
            await second.close()
        }
        // last holder out runs the sweep
        expect(pgrepCalls()).toHaveLength(1)
        expect(fs.existsSync(lockPath)).toBe(false)
    })

    it('rechecks the holder registry before killing when a mission claims mid-sweep', async () => {
        const killSpy = vi.spyOn(process, 'kill').mockImplementation(() => true)
        const client = new WdioMcpClient({ command: process.execPath, args: [MCP_SERVER] })
        try {
            await client.getTools()
            // a second mission claims the profile while the sweep is running
            const delegate = vi.mocked(execFile).getMockImplementation() as unknown as
                (file: string, args: string[], cb: (err: Error | null, stdout: string, stderr: string) => void) => childProcess.ChildProcess
            vi.mocked(execFile).mockImplementationOnce((file, args, cb) => {
                fs.writeFileSync(path.join(lockPath, '424242'), '')
                return delegate(file as string, args as string[], cb as (err: Error | null, stdout: string, stderr: string) => void)
            })
            await client.close()
            // sweep ran but the recheck caught the new holder — nothing killed
            expect(pgrepCalls()).toHaveLength(1)
            expect(killSpy).not.toHaveBeenCalled()
            expect(fs.existsSync(path.join(lockPath, '424242'))).toBe(true)
        } finally {
            killSpy.mockRestore()
            await client.close().catch(() => {})
        }
    })

    it('prunes holders that crashed without releasing', async () => {
        fs.mkdirSync(lockPath, { recursive: true })
        fs.writeFileSync(path.join(lockPath, '999999'), '')
        const client = new WdioMcpClient({ command: process.execPath, args: [MCP_SERVER] })
        try {
            await client.getTools()
            const held = holderPids()
            expect(held).toHaveLength(1)
            expect(held[0]).not.toBe(999999)
            // the surviving entry is the live server pid, not the stale one
            expect(() => process.kill(held[0], 0)).not.toThrow()
        } finally {
            await client.close()
        }
    })
})
