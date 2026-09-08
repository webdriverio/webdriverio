// Minimal in-process MCP server for deepagent tests: speaks the MCP
// JSON-RPC handshake over stdio and answers tools/list + tools/call.
// Every call is appended to $FIXTURE_LOG (JSONL) so tests can assert the
// exact tool-call order the agent made. FIXTURE_TOOL_SURFACE=extended
// registers the e2e-only tools (get_title/reply/crash); the default
// 2-tool surface serves the package unit suite.
import readline from 'node:readline'
import fs from 'node:fs'

const EXTENDED = process.env.FIXTURE_TOOL_SURFACE === 'extended'

const send = (msg) => process.stdout.write(JSON.stringify(msg) + '\n')

const rl = readline.createInterface({ input: process.stdin })
rl.on('line', (line) => {
    let msg
    try {
        msg = JSON.parse(line)
    } catch {
        return
    }
    // notifications carry no id — never answer them
    if (msg.id === undefined) {
        return
    }
    if (msg.method === 'initialize') {
        send({
            jsonrpc: '2.0',
            id: msg.id,
            result: {
                protocolVersion: msg.params?.protocolVersion,
                capabilities: { tools: {} },
                serverInfo: { name: 'fixture-mcp', version: '1.0.0' },
            },
        })
    } else if (msg.method === 'tools/list') {
        const tools = [
            {
                name: 'fixture_navigate',
                description: 'Navigate to a URL',
                inputSchema: {
                    type: 'object',
                    properties: { url: { type: 'string' } },
                    required: ['url'],
                },
            },
            {
                name: 'fixture_click',
                description: 'Click an element',
                inputSchema: {
                    type: 'object',
                    properties: { selector: { type: 'string' } },
                    required: ['selector'],
                },
            },
        ]
        if (EXTENDED) {
            tools.push(
                {
                    name: 'fixture_get_title',
                    description: 'Return the current page title',
                    inputSchema: {
                        type: 'object',
                        properties: { title: { type: 'string' } },
                    },
                },
                {
                    name: 'fixture_reply',
                    description: 'Emit a scripted reply',
                    inputSchema: {
                        type: 'object',
                        properties: { text: { type: 'string' } },
                    },
                },
                {
                    name: 'fixture_crash',
                    description: 'Simulates an MCP transport failure',
                    inputSchema: {
                        type: 'object',
                        properties: {},
                    },
                },
            )
        }
        send({ jsonrpc: '2.0', id: msg.id, result: { tools } })
    } else if (msg.method === 'tools/call') {
        const { name, arguments: args } = msg.params ?? {}
        if (process.env.FIXTURE_LOG) {
            fs.appendFileSync(process.env.FIXTURE_LOG, JSON.stringify({ name, args: args ?? {} }) + '\n')
        }
        // FIXTURE_SESSION_LOST simulates a dead browser session the way
        // @wdio/mcp reports it (isError result); the adapter throws on it,
        // which exercises the harness's error-recovery wrapper.
        if (process.env.FIXTURE_SESSION_LOST && name !== 'fixture_crash') {
            send({
                jsonrpc: '2.0',
                id: msg.id,
                result: {
                    content: [{ type: 'text', text: 'Error navigating: Error: No active browser session' }],
                    isError: true,
                },
            })
            return
        }
        let text = 'fixture ok'
        if (EXTENDED) {
            if (name === 'fixture_get_title') {
                text = args?.title ?? 'Fixture Title'
            } else if (name === 'fixture_click') {
                text = `clicked ${args?.selector ?? ''}`
            } else if (name === 'fixture_reply') {
                text = args?.text ?? 'fixture ok'
            } else if (name === 'fixture_crash') {
                // transport-level failure: exit the server mid-call
                process.exit(1)
            }
        }
        if (name === 'fixture_navigate' && process.env.FIXTURE_MARKER) {
            fs.writeFileSync(process.env.FIXTURE_MARKER, JSON.stringify(args ?? {}))
        }
        send({
            jsonrpc: '2.0',
            id: msg.id,
            result: { content: [{ type: 'text', text }] },
        })
    } else {
        // ping & anything else
        send({ jsonrpc: '2.0', id: msg.id, result: {} })
    }
})
