import readline from 'node:readline'
import type { DeepAgent } from 'deepagents'
import { processTurn } from './turn.js'

/**
 * Interactive agent REPL: a readline chat loop. Each prompt runs one agent
 * turn; tool calls are printed as they're recorded, then the final reply.
 * `close`/`close session`/`reset` closes the browser session without exiting;
 * `exit`/`quit`/Ctrl-C shuts down cleanly (closing the MCP server).
 */
export async function runRepl(agent: DeepAgent, onClose: () => Promise<void>, closeSession?: () => Promise<void>): Promise<void> {
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

    // a pasted multi-line input emits one 'line' per line; concurrent turns
    // would race on the agent's thread_id, so input arriving mid-turn is dropped
    let busy = false
    rl.on('line', async (line) => {
        const text = line.trim()
        if (!text) {
            rl.prompt()
            return
        }
        if (busy) {
            console.log('[@wdio/deepagent] still running the previous turn — input ignored (Ctrl-C to stop)')
            rl.prompt()
            return
        }
        if (text === 'close' || text === 'close session' || text === 'reset') {
            if (!closeSession) {
                console.log('[@wdio/deepagent] no browser session to close')
            } else {
                try {
                    await closeSession()
                    console.log('[@wdio/deepagent] session closed')
                } catch (err) {
                    console.log(`[@wdio/deepagent] ${(err as Error).message}`)
                }
            }
            rl.prompt()
            return
        }
        if (text === 'exit' || text === 'quit') {
            await shutdown(0)
            return
        }
        busy = true
        try {
            const { reply, toolCalls } = await processTurn(agent, text, {
                // heal=ask gates writes behind an interrupt — the default
                // auto-approve is for CI; an interactive repl must ask.
                resolveInterrupt: async (request) => {
                    for (const action of request.actionRequests) {
                        console.log(`\n  ⚠️  ${action.description}`)
                    }
                    const answer = await new Promise<string>((resolve) => rl.question('  Approve? [y/N] ', resolve))
                    return /^y(es)?$/i.test(answer.trim())
                },
            })
            for (const call of toolCalls) {
                console.log(`  🔧 ${call.name} ${JSON.stringify(call.args ?? {})}`)
            }
            if (reply) {
                console.log(reply)
            }
        } catch (err) {
            console.error(`[@wdio/deepagent] turn failed: ${(err as Error).message}`)
        } finally {
            busy = false
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
