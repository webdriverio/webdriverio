import type readline from 'node:readline'
import type { TurnInterruptRequest } from './turn.js'

export const ARGS_TRUNCATE = 200

/** Ellipsizes `s` past `n` chars (default: the shared args truncation limit). */
export function truncate(s: string, n = ARGS_TRUNCATE): string {
    return s.length > n ? `${s.slice(0, n)}…` : s
}

/** Parses a y/N answer — 'y' or 'yes' (case-insensitive) approves. */
export function parseYesNo(value: string): boolean {
    return /^y(es)?$/i.test(value.trim())
}

const truncateValues = (value: unknown, seen = new WeakSet<object>()): unknown => {
    if (value && typeof value === 'object') {
        // args is `unknown` at the type level, so a circular reference would
        // recurse forever and blow the stack — placeholder instead
        if (seen.has(value)) {
            return '[circular]'
        }
        seen.add(value)
    }
    if (typeof value === 'string') {
        return truncate(value)
    }
    if (Array.isArray(value)) {
        return value.map((v) => truncateValues(v, seen))
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, truncateValues(v, seen)]))
    }
    return value
}

/** Describes a gated action: header with name/file_path, then truncated remaining args. */
export function describeActionRequest(action: TurnInterruptRequest['actionRequests'][number]): string {
    // description is langchain boilerplate re-dumping the same args — deliberately ignored
    const args = (action.args && typeof action.args === 'object' ? action.args : {}) as Record<string, unknown>
    const { file_path: filePath, ...rest } = args
    const header = `\n  [!] ${action.name}${typeof filePath === 'string' ? `  ${filePath}` : ''}`
    if (Object.keys(rest).length === 0) {
        return header
    }
    const body = JSON.stringify(truncateValues(rest), null, 2)
    return `${header}\n${body.split('\n').map((line) => `      ${line}`).join('\n')}`
}

/** Interactive y/N approval for gated tool calls (heal=ask). */
export function createInterruptResolver(rl: readline.Interface): (request: TurnInterruptRequest) => Promise<boolean> {
    // one persistent listener — per-prompt `once('close')` listeners leak until
    // the interface closes, holding every pending approval promise
    let rejectPending: ((err: Error) => void) | undefined
    rl.on('close', () => {
        rejectPending?.(new Error('interrupt prompt closed — mission aborted'))
        rejectPending = undefined
    })
    return async (request) => {
        for (const action of request.actionRequests) {
            const why = typeof action.description === 'string' ? action.description.trim() : ''
            if (why) {
                console.log(`  ${truncate(why)}`)
            }
            console.log(describeActionRequest(action))
        }
        const answer = await new Promise<string>((resolve, reject) => {
            rejectPending = reject
            rl.question('  Approve? [y/N] ', resolve)
        })
        rejectPending = undefined
        return parseYesNo(answer)
    }
}
