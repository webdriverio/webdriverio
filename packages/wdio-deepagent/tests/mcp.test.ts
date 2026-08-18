import { describe, expect, it, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type * as childProcess from 'node:child_process'
import { WdioMcpClient, isDescendantOf, resolveLocalMcpBin, resolveMcpSpawn } from '../src/mcp/index.js'

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
    it.skipIf(process.platform === 'win32' || process.platform === 'darwin')('isDescendantOf finds the current process under init', () => {
        expect(isDescendantOf(process.pid, 1)).toBe(true)
    })

    it.skipIf(process.platform === 'win32' || process.platform === 'darwin')('isDescendantOf rejects a non-ancestor', () => {
        expect(isDescendantOf(1, process.pid)).toBe(false)
    })
})

describe('chrome cleanup pgrep invocation', () => {
    it('calls pgrep -f via execFile with args, never a shell string', async () => {
        const { execFile } = await import('node:child_process')
        const client = new WdioMcpClient({ command: process.execPath, args: [MCP_SERVER] })
        try {
            await client.getTools()
        } finally {
            await client.close()
        }
        const mock = vi.mocked(execFile)
        const pgrepCall = mock.mock.calls.find((call) => call[0] === 'pgrep')
        expect(pgrepCall).toBeDefined()
        // args passed as an array is the no-shell guarantee: execFile never
        // interpolates into a shell command line
        const args = pgrepCall![1] as string[]
        expect(args).toHaveLength(2)
        expect(args[0]).toBe('-f')
        // same bracketed pattern the pre-fix shell form passed to pgrep
        expect(args[1]).toMatch(/^\[u\]ser-data-dir=/)
        expect(args[1]).toContain('chrome-debug')
    })
})
