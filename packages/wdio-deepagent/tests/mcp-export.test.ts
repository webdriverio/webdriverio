import { describe, expect, it } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { FakeToolCallingModel } from 'langchain'
import { createDeepAgentHarness, createToolSurface } from '../src/agent.js'
import { serveAsMcpServer } from '../src/mcp/index.js'

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures')
const MCP_SERVER = path.join(FIXTURES, 'mcp-server.mjs')

describe('serveAsMcpServer (MCP export)', () => {
    it('serves the harness tools over MCP and executes a traversal tool call', async () => {
        const harness = await createDeepAgentHarness({
            model: { provider: 'openai', model: 'fake' },
            modelOverride: new FakeToolCallingModel({ toolCalls: [], toolStyle: 'openai' }),
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
            heal: 'ask',
        })

        const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
        const client = new Client({ name: 'test-client', version: '1.0.0' }, { capabilities: {} })

        try {
            const serving = serveAsMcpServer(harness, serverTransport)
            await client.connect(clientTransport)
            await serving

            const { tools } = await client.listTools()
            const names = tools.map((t) => t.name)
            expect(names).toContain('fixture_navigate')
            expect(names).toContain('ingest_trace')
            expect(names).toContain('remember_snapshot')

            const res = await client.callTool({ name: 'fixture_navigate', arguments: { url: 'https://example.com' } })
            const text = res.content?.find((c) => c.type === 'text') as { text: string } | undefined
            expect(text?.text).toContain('fixture ok')
        } finally {
            await client.close()
            await harness.close()
        }
    })

    it('serves the tool surface without a model', async () => {
        const surface = await createToolSurface({
            mcp: { command: process.execPath, args: [MCP_SERVER] },
            traceDir: 'test-results',
        })
        try {
            const names = surface.tools.map((t) => t.name)
            expect(names).toContain('fixture_navigate')
            expect(names).toContain('ingest_trace')
            expect(names).toContain('remember_snapshot')
        } finally {
            await surface.close()
        }
    })
})
