import type { CacheEntry, CacheFile } from './cache.js'

export interface ActCall {
    /**
     * offsets of the whole statement, from `await` to the optional `;`
     */
    start: number
    end: number
    indent: string
    instruction: string
    id?: string
    /**
     * source of the `values` object, e.g. `{ email: process.env.USER }`
     */
    values?: string
}

export interface EjectResult {
    source: string
    ejected: { instruction: string, steps: number }[]
    skipped: { instruction: string, reason: string }[]
}

const QUOTES = new Set(['\'', '"', '`'])

/**
 * end of a string literal that starts at `start`, or -1
 */
function skipString (source: string, start: number) {
    const quote = source[start]
    for (let i = start + 1; i < source.length; i++) {
        if (source[i] === '\\') {
            i++
        } else if (quote === '`' && source[i] === '$' && source[i + 1] === '{') {
            return -1
        } else if (source[i] === quote) {
            return i
        }
    }
    return -1
}

/**
 * offset of the bracket that closes the one at `start`
 */
function matchBracket (source: string, start: number) {
    const open = source[start]
    const close = open === '(' ? ')' : open === '{' ? '}' : ']'
    let depth = 0
    for (let i = start; i < source.length; i++) {
        const char = source[i]
        if (QUOTES.has(char)) {
            const end = skipString(source, i)
            if (end === -1) {
                return -1
            }
            i = end
        } else if (char === open) {
            depth++
        } else if (char === close && --depth === 0) {
            return i
        }
    }
    return -1
}

function unquote (literal: string) {
    const quote = literal[0]
    return literal.slice(1, -1).replace(new RegExp(`\\\\(${quote === '`' ? '`' : quote}|\\\\)`, 'g'), '$1')
}

/**
 * the value of a top-level property in an object literal source
 */
function property (object: string, name: string): string | undefined {
    const match = new RegExp(`(?:^|[{,\\s])${name}\\s*:\\s*`).exec(object)
    if (!match) {
        return undefined
    }
    const start = match.index + match[0].length
    const char = object[start]
    if (QUOTES.has(char)) {
        const end = skipString(object, start)
        return end === -1 ? undefined : object.slice(start, end + 1)
    }
    if (char === '{' || char === '[' || char === '(') {
        const end = matchBracket(object, start)
        return end === -1 ? undefined : object.slice(start, end + 1)
    }
    const end = object.slice(start).search(/[,}]/)
    return object.slice(start, end === -1 ? undefined : start + end).trim()
}

/**
 * Find the `await <scope>.act('instruction', options?)` statements of a
 * spec whose instruction is a plain string literal.
 */
export function findActCalls (source: string): ActCall[] {
    const calls: ActCall[] = []
    const pattern = /\.act\(/g
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source))) {
        const open = match.index + match[0].length - 1
        const close = matchBracket(source, open)
        if (close === -1) {
            continue
        }
        const lineStart = source.lastIndexOf('\n', match.index) + 1
        const statement = source.slice(lineStart, match.index)
        const prefix = /^(\s*)await\s+[\w$.]+(?:\([^]*\))?$/.exec(statement)
        if (!prefix) {
            continue
        }
        const args = source.slice(open + 1, close).trim()
        if (!QUOTES.has(args[0])) {
            continue
        }
        const literalEnd = skipString(args, 0)
        if (literalEnd === -1) {
            continue
        }
        const rest = args.slice(literalEnd + 1).trim().replace(/^,/, '').trim()
        const options = rest.startsWith('{') ? rest.slice(0, matchBracket(rest, 0) + 1) : ''
        const id = options ? property(options, 'id') : undefined
        let end = close + 1
        if (source[end] === ';') {
            end++
        }
        calls.push({
            start: lineStart,
            end,
            indent: prefix[1],
            instruction: unquote(args.slice(0, literalEnd + 1)),
            ...(id && QUOTES.has(id[0]) ? { id: unquote(id) } : {}),
            ...(options && property(options, 'values') ? { values: property(options, 'values') } : {})
        })
    }
    return calls
}

/**
 * A recorded code line with `{{name}}` placeholders turned into
 * `values.name` expressions.
 */
export function codeWithValues (code: string, values = 'values') {
    return code.replace(/(['"`])((?:\\.|(?!\1).)*)\1/g, (literal, _quote: string, body: string) => {
        if (!/\{\{\s*[\w.-]+\s*\}\}/.test(body)) {
            return literal
        }
        const whole = /^\{\{\s*([\w.-]+)\s*\}\}$/.exec(body)
        if (whole) {
            return `${values}[${JSON.stringify(whole[1])}]`
        }
        return '`' + body.replace(/`/g, '\\`').replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_m, name: string) => `\${${values}[${JSON.stringify(name)}]}`) + '`'
    })
}

function sameSteps (entries: CacheEntry[]) {
    const first = JSON.stringify(entries[0].steps.map((step) => step.code))
    return entries.every((entry) => JSON.stringify(entry.steps.map((step) => step.code)) === first)
}

/**
 * Replace `act()` calls with the code recorded in the cache. The instruction
 * stays as a comment. Calls that are not cached, or cached with different
 * steps under several keys, are left alone and reported.
 */
export function eject (source: string, cache: CacheFile, options: { test?: string } = {}): EjectResult {
    const result: EjectResult = { source, ejected: [], skipped: [] }
    const keys = Object.keys(cache.entries).filter((key) => !options.test || key.startsWith(`${options.test} › `))
    let output = ''
    let cursor = 0
    for (const call of findActCalls(source)) {
        const candidates = call.id
            ? (cache.entries[call.id] && cache.entries[call.id].instruction === call.instruction ? [cache.entries[call.id]] : [])
            : keys.map((key) => cache.entries[key]).filter((entry) => entry.instruction === call.instruction)
        if (!candidates.length) {
            result.skipped.push({ instruction: call.instruction, reason: 'no cached steps, run the test once to record them' })
            continue
        }
        if (!sameSteps(candidates)) {
            result.skipped.push({ instruction: call.instruction, reason: 'recorded with different steps in several tests, pass `id` or `--test`' })
            continue
        }
        const lines = [`${call.indent}// act: ${call.instruction.replace(/\n/g, ' ')}`]
        if (call.values) {
            lines.push(`${call.indent}const values = ${call.values}`)
        }
        lines.push(...candidates[0].steps.map((step) => `${call.indent}${codeWithValues(step.code)}`))
        const block = call.values
            ? [`${call.indent}{`, ...lines.map((line) => `    ${line}`), `${call.indent}}`].join('\n')
            : lines.join('\n')
        output += source.slice(cursor, call.start) + block
        cursor = call.end
        result.ejected.push({ instruction: call.instruction, steps: candidates[0].steps.length })
    }
    result.source = output + source.slice(cursor)
    return result
}
