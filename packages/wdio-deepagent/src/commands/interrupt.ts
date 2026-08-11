import type readline from 'node:readline'
import type { TurnInterruptRequest } from './turn.js'

const ARGS_TRUNCATE = 200

/** One line describing a gated action: name, truncated args, and the description. */
export function describeActionRequest(action: TurnInterruptRequest['actionRequests'][number]): string {
    const args = JSON.stringify(action.args ?? {})
    const preview = args.length > ARGS_TRUNCATE ? `${args.slice(0, ARGS_TRUNCATE)}…` : args
    return `\n  ⚠️  ${action.name} ${preview} — ${action.description}`
}

/** Interactive y/N approval for gated tool calls (heal=ask). */
export function createInterruptResolver(rl: readline.Interface): (request: TurnInterruptRequest) => Promise<boolean> {
    return async (request) => {
        for (const action of request.actionRequests) {
            console.log(describeActionRequest(action))
        }
        const answer = await new Promise<string>((resolve, reject) => {
            rl.question('  Approve? [y/N] ', resolve)
            // closing the interface (Ctrl-C) leaves the question pending forever
            rl.once('close', () => reject(new Error('interrupt prompt closed — mission aborted')))
        })
        return /^y(es)?$/i.test(answer.trim())
    }
}
