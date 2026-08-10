import readline from 'node:readline'
import type { DeepAgent } from 'deepagents'
import { processTurn } from './turn.js'

/**
 * Interactive agent REPL: a readline chat loop. Each prompt runs one agent
 * turn; tool calls are printed as they're recorded, then the final reply.
 * `exit`/`quit`/Ctrl-C shuts down cleanly (closing the MCP server).
 */
export async function runRepl(agent: DeepAgent, onClose: () => Promise<void>): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: 'wdio> ',
    })

    let closed = false
    const shutdown = async (code: number) => {
        if (closed) {
            return
        }
        closed = true
        rl.close()
        await onClose()
        process.exitCode = code
    }

    rl.prompt()

    rl.on('line', async (line) => {
        const text = line.trim()
        if (!text) {
            rl.prompt()
            return
        }
        if (text === 'exit' || text === 'quit') {
            await shutdown(0)
            return
        }
        try {
            const { reply, toolCalls } = await processTurn(agent, text)
            for (const call of toolCalls) {
                console.log(`  🔧 ${call.name} ${JSON.stringify(call.args ?? {})}`)
            }
            if (reply) {
                console.log(reply)
            }
        } catch (err) {
            console.error(`[wdio-deepagent] turn failed: ${(err as Error).message}`)
        }
        rl.prompt()
    })

    rl.on('close', async () => {
        await shutdown(0)
    })

    rl.on('SIGINT', async () => {
        await shutdown(0)
    })
}
