// Minimal in-process MCP server for integration tests: speaks the MCP
// JSON-RPC handshake over stdio and answers tools/list + tools/call.
import readline from 'node:readline'
import fs from 'node:fs'

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
        send({
            jsonrpc: '2.0',
            id: msg.id,
            result: {
                tools: [
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
                        },
                    },
                ],
            },
        })
    } else if (msg.method === 'tools/call') {
        if (msg.params?.name === 'fixture_navigate' && process.env.FIXTURE_MARKER) {
            fs.writeFileSync(process.env.FIXTURE_MARKER, JSON.stringify(msg.params.arguments ?? {}))
        }
        send({
            jsonrpc: '2.0',
            id: msg.id,
            result: { content: [{ type: 'text', text: 'fixture ok' }] },
        })
    } else {
        // ping & anything else
        send({ jsonrpc: '2.0', id: msg.id, result: {} })
    }
})
