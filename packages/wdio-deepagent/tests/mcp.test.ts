import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WdiMcpClient, resolveLocalMcpBin, resolveMcpSpawn } from '../src/mcp/index.js'

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

describe('WdiMcpClient (integration over stdio)', () => {
    it('loads tools from a spawned MCP server and closes cleanly', async () => {
        const client = new WdiMcpClient({ command: process.execPath, args: [MCP_SERVER] })

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
        const client = new WdiMcpClient({ command: process.execPath, args: [MCP_SERVER] })
        await client.getTools()
        await client.close()
        const tools = await client.getTools()
        expect(tools.length).toBeGreaterThanOrEqual(2)
        await client.close()
    })
})
