import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js'
import type { z } from 'zod'
import type { DeepAgentHarness } from '../agent.js'
import { VERSION } from '../constants.js'
import { isZodSchema, jsonSchemaToZodRawShape } from './json-schema-to-zod.js'
import type { JsonSchemaObject } from './json-schema-to-zod.js'

/**
 * Exposes the harness tools (traversal via @wdio/mcp + trace + site KB)
 * as an MCP server, so Claude Desktop / Claude Code (or any MCP client)
 * can drive the same agent surface. Default transport is stdio (blocks
 * until stdin closes); tests pass an in-memory transport.
 */
export async function serveAsMcpServer(harness: DeepAgentHarness, transport: Transport = new StdioServerTransport()): Promise<void> {
    const server = new McpServer(
        { name: 'wdio-deepagent', version: VERSION },
        { capabilities: { tools: {} } },
    )

    for (const t of harness.tools) {
        // MCP-adapter tools carry a plain JSON schema; langchain tool()
        // schemas are zod objects — convert only the former.
        const inputSchema = isZodSchema(t.schema)
            ? t.schema as unknown as z.ZodRawShape
            : jsonSchemaToZodRawShape(t.schema as unknown as JsonSchemaObject)
        server.registerTool(t.name, {
            title: t.name,
            description: t.description ?? t.name,
            inputSchema,
        }, async (args) => {
            const result = await t.invoke(args)
            const text = typeof result === 'string' ? result : JSON.stringify(result)
            return { content: [{ type: 'text', text }] }
        })
    }

    await server.connect(transport)
}
