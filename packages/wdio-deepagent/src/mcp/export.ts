import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { DeepAgentHarness } from '../agent.js'
import { jsonSchemaToZodRawShape } from './json-schema-to-zod.js'

/**
 * Exposes the harness tools (traversal via @wdio/mcp + trace + site KB)
 * as an MCP server, so Claude Desktop / Claude Code (or any MCP client)
 * can drive the same agent surface. Default transport is stdio (blocks
 * until stdin closes); tests pass an in-memory transport.
 */
export async function serveAsMcpServer(harness: DeepAgentHarness, transport: Transport = new StdioServerTransport()): Promise<void> {
    const server = new McpServer(
        { name: 'wdio-deepagent', version: '9.30.1' },
        { capabilities: { tools: {} } },
    )

    for (const t of harness.tools) {
        // langchain v1 tools carry a plain JSON schema; convert to a zod
        // raw shape which the MCP SDK accepts natively.
        server.registerTool(t.name, {
            title: t.name,
            description: t.description ?? t.name,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inputSchema: jsonSchemaToZodRawShape(t.schema as any),
        }, async (args) => {
            const result = await t.invoke(args)
            const text = typeof result === 'string' ? result : JSON.stringify(result)
            return { content: [{ type: 'text', text }] }
        })
    }

    await server.connect(transport)
}
