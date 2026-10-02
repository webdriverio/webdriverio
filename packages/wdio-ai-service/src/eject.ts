import { parse } from '@babel/parser'

import { cacheKey, type CacheEntry, type CacheFile } from './cache.js'

export interface ActCall {
    /**
     * offsets of the whole `await <scope>.act(...)` statement
     */
    start: number
    end: number
    indent: string
    /**
     * `undefined` when the instruction is not a plain string literal
     */
    instruction?: string
    id?: string
    /**
     * source of the `values` object, e.g. `{ email: process.env.USER }`
     */
    values?: string
    /**
     * full title of the test the call is in, like Mocha's `fullTitle()`,
     * `undefined` when a title is not a plain string
     */
    test?: string
    /**
     * position of the call among the `act` calls of its test, the same
     * count the service uses for the cache key. `undefined` when an earlier
     * or this call runs in a branch, a loop or a callback, so the position
     * is not known from the source.
     */
    position?: number
    /**
     * the call is a statement of its own, so it can be replaced
     */
    statement: boolean
}

export interface EjectResult {
    source: string
    ejected: { instruction: string, steps: number }[]
    skipped: { instruction: string, reason: string }[]
}

interface AstNode {
    type: string
    start?: number | null
    end?: number | null
    [key: string]: unknown
}

const SUITES = new Set(['describe', 'context', 'suite'])
const TESTS = new Set(['it', 'test', 'specify'])
/**
 * an `act` call inside one of these may run any number of times
 */
const CONDITIONAL = new Set([
    'IfStatement', 'ConditionalExpression', 'LogicalExpression', 'SwitchStatement',
    'ForStatement', 'ForInStatement', 'ForOfStatement', 'WhileStatement', 'DoWhileStatement',
    'FunctionExpression', 'ArrowFunctionExpression', 'FunctionDeclaration', 'ClassMethod', 'ObjectMethod'
])
const SKIPPED_KEYS = new Set(['loc', 'start', 'end', 'extra', 'leadingComments', 'trailingComments', 'innerComments', 'range'])

function isNode (value: unknown): value is AstNode {
    return Boolean(value && typeof value === 'object' && typeof (value as AstNode).type === 'string')
}

/**
 * the text of a string literal or a template literal without expressions
 */
function literal (node: unknown): string | undefined {
    if (!isNode(node)) {
        return undefined
    }
    if (node.type === 'StringLiteral') {
        return node.value as string
    }
    if (node.type === 'TemplateLiteral' && !(node.expressions as unknown[]).length) {
        return ((node.quasis as AstNode[])[0].value as { cooked: string }).cooked
    }
    return undefined
}

/**
 * `describe`, `describe.only`, `it.skip`, … of a call
 */
function frameworkName (callee: unknown): string | undefined {
    if (!isNode(callee)) {
        return undefined
    }
    if (callee.type === 'Identifier') {
        return callee.name as string
    }
    if (callee.type === 'MemberExpression' && isNode(callee.object) && callee.object.type === 'Identifier') {
        return callee.object.name as string
    }
    return undefined
}

function isActCall (node: AstNode) {
    const callee = node.callee
    return isNode(callee) && callee.type === 'MemberExpression' && !callee.computed &&
        isNode(callee.property) && callee.property.type === 'Identifier' && callee.property.name === 'act'
}

function property (object: unknown, name: string): AstNode | undefined {
    if (!isNode(object) || object.type !== 'ObjectExpression') {
        return undefined
    }
    const found = (object.properties as AstNode[]).find((prop) => prop.type === 'ObjectProperty' && !prop.computed &&
        isNode(prop.key) && (prop.key.name === name || prop.key.value === name))
    return found?.value as AstNode | undefined
}

interface TestScope {
    title?: string
    count: number
    /**
     * an `act` call ran conditionally, positions after it are unknown
     */
    uncertain: boolean
}

/**
 * Find the `act` calls of a spec with `@babel/parser`, with the test they
 * are in and their position in it.
 */
export function findActCalls (source: string): ActCall[] {
    const ast = parse(source, { sourceType: 'module', plugins: ['typescript'], errorRecovery: true }) as unknown as AstNode
    const calls: ActCall[] = []

    const visit = (node: AstNode, parents: AstNode[], titles: (string | undefined)[], test: TestScope | undefined, conditional: boolean) => {
        if (node.type === 'CallExpression') {
            const name = frameworkName(node.callee)
            const args = node.arguments as AstNode[]
            const body = args.find((arg) => arg.type === 'ArrowFunctionExpression' || arg.type === 'FunctionExpression')
            if (name && body && (SUITES.has(name) || TESTS.has(name))) {
                const title = literal(args[0])
                if (SUITES.has(name)) {
                    visit(body.body as AstNode, [], [...titles, title], undefined, false)
                } else {
                    const known = [...titles, title].every((part) => part !== undefined)
                    visit(body.body as AstNode, [], titles, { title: known ? [...titles, title].join(' ') : undefined, count: 0, uncertain: false }, false)
                }
                return
            }
            if (isActCall(node)) {
                const [parent, grandparent] = [parents.at(-1), parents.at(-2)]
                const statement = parent?.type === 'AwaitExpression' && grandparent?.type === 'ExpressionStatement'
                if (test) {
                    test.count++
                    test.uncertain ||= conditional
                }
                const target = statement ? grandparent! : node
                const start = target.start!
                const lineStart = source.lastIndexOf('\n', start - 1) + 1
                const indent = source.slice(lineStart, start)
                const options = args[1]
                const id = literal(property(options, 'id'))
                const values = property(options, 'values')
                calls.push({
                    start: /^\s*$/.test(indent) ? lineStart : start,
                    end: target.end!,
                    indent: /^\s*$/.test(indent) ? indent : '',
                    instruction: literal(args[0]),
                    ...(id !== undefined ? { id } : {}),
                    ...(values ? { values: source.slice(values.start!, values.end!) } : {}),
                    ...(test?.title !== undefined ? { test: test.title } : {}),
                    ...(test && !test.uncertain ? { position: test.count } : {}),
                    statement: statement && /^\s*$/.test(indent)
                })
                return
            }
        }
        const nested = conditional || (parents.length > 0 && CONDITIONAL.has(node.type))
        for (const [key, value] of Object.entries(node)) {
            if (SKIPPED_KEYS.has(key)) {
                continue
            }
            for (const child of Array.isArray(value) ? value : [value]) {
                if (isNode(child)) {
                    visit(child, [...parents, node], titles, test, nested)
                }
            }
        }
    }
    visit(ast, [], [], undefined, false)
    return calls.sort((a, b) => a.start - b.start)
}

/**
 * A recorded code line with `{{name}}` placeholders turned into
 * `values.name` expressions.
 */
export function codeWithValues (code: string, values = 'values') {
    return code.replace(/(['"`])((?:\\.|(?!\1).)*)\1/g, (literalSource, _quote: string, body: string) => {
        if (!/\{\{\s*[\w.-]+\s*\}\}/.test(body)) {
            return literalSource
        }
        const whole = /^\{\{\s*([\w.-]+)\s*\}\}$/.exec(body)
        if (whole) {
            return `${values}[${JSON.stringify(whole[1])}]`
        }
        /**
         * the text becomes a template literal: backticks and `${` that were
         * plain text must stay plain text
         */
        const escaped = body.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')
        return '`' + escaped.replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_m, name: string) => `\${${values}[${JSON.stringify(name)}]}`) + '`'
    })
}

/**
 * the cache entry of a call: its `id`, or its test and position, with the
 * platform suffix of an app entry
 */
function entryFor (call: ActCall, cache: CacheFile): { key?: string, entry?: CacheEntry } {
    const key = call.id ?? (call.test !== undefined && call.position !== undefined ? cacheKey(call.test, call.position) : undefined)
    if (!key) {
        return {}
    }
    if (cache.entries[key]) {
        return { key, entry: cache.entries[key] }
    }
    const platformKeys = Object.keys(cache.entries).filter((candidate) => candidate.startsWith(`${key} (`))
    return platformKeys.length === 1 ? { key: platformKeys[0], entry: cache.entries[platformKeys[0]] } : { key }
}

/**
 * Replace `act()` calls with the code recorded for exactly that call: the
 * entry of its `id`, or of its test and position in the test. The
 * instruction stays as a comment. Calls without a matching entry are left
 * alone and reported.
 */
export function eject (source: string, cache: CacheFile, options: { test?: string } = {}): EjectResult {
    const result: EjectResult = { source, ejected: [], skipped: [] }
    let output = ''
    let cursor = 0
    for (const call of findActCalls(source)) {
        if (call.instruction === undefined || (options.test && call.test !== options.test)) {
            continue
        }
        const { key, entry } = entryFor(call, cache)
        if (!key) {
            result.skipped.push({ instruction: call.instruction, reason: 'the call has no fixed position in a test with a plain string title, pass `id` to the call' })
            continue
        }
        if (!entry) {
            result.skipped.push({ instruction: call.instruction, reason: 'no cached steps, run the test once to record them' })
            continue
        }
        if (entry.instruction !== call.instruction) {
            result.skipped.push({ instruction: call.instruction, reason: `the steps cached as "${key}" are for "${entry.instruction}", run the test again to record this call` })
            continue
        }
        if (!call.statement) {
            result.skipped.push({ instruction: call.instruction, reason: 'only `await <scope>.act(...)` statements on their own line are replaced' })
            continue
        }
        const lines = [`${call.indent}// act: ${call.instruction.replace(/\n/g, ' ')}`]
        if (call.values) {
            lines.push(`${call.indent}const values = ${call.values}`)
        }
        lines.push(...entry.steps.map((step) => `${call.indent}${codeWithValues(step.code)}`))
        const block = call.values
            ? [`${call.indent}{`, ...lines.map((line) => `    ${line}`), `${call.indent}}`].join('\n')
            : lines.join('\n')
        output += source.slice(cursor, call.start) + block
        cursor = call.end
        result.ejected.push({ instruction: call.instruction, steps: entry.steps.length })
    }
    result.source = output + source.slice(cursor)
    return result
}
