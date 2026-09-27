import module from 'node:module'

import { parse, type Node } from 'acorn'

import { SessionError } from '../errors.js'

/**
 * a subset of ESTree, enough for the rewrites below
 */
interface AnyNode extends Node {
    [key: string]: unknown
}

export interface TransformResult {
    /**
     * body of an async function, run in the session context
     */
    code: string
    /**
     * `warn: line N: …` messages for likely mistakes
     */
    warnings: string[]
    /**
     * the code only reads state and is not worth recording in the history
     */
    readOnly: boolean
}

const PARSE_OPTIONS = {
    ecmaVersion: 'latest',
    sourceType: 'module',
    allowAwaitOutsideFunction: true,
    allowReturnOutsideFunction: true,
    locations: true
} as const

const IMPORT_FN = '__wdioImport'
const BROWSER_NAMES = new Set(['browser', 'driver'])
const SELECTOR_FNS = new Set(['$', '$$'])

/**
 * Remove TypeScript annotations, keeping positions. Code that cannot be
 * stripped (enums, namespaces, `<T>x` casts) is returned unchanged and
 * fails in the parser with a normal syntax error.
 */
export function stripTypes (code: string) {
    const strip = (module as unknown as { stripTypeScriptTypes?: (code: string, opts: { mode: 'strip' }) => string }).stripTypeScriptTypes
    if (!strip) {
        return code
    }
    const emit = process.emitWarning
    try {
        process.emitWarning = () => {}
        return strip(code, { mode: 'strip' })
    } catch {
        return code
    } finally {
        process.emitWarning = emit
    }
}

export function parseCode (code: string) {
    try {
        return parse(code, PARSE_OPTIONS) as unknown as AnyNode & { body: AnyNode[] }
    } catch (err) {
        const e = err as SyntaxError & { loc?: { line: number, column: number } }
        const message = e.message.replace(/\s*\(\d+:\d+\)$/, '')
        const where = e.loc ? ` (line ${e.loc.line}:${e.loc.column + 1})` : ''
        throw new SessionError('EXEC_ERROR', `SyntaxError: ${message}${where}`)
    }
}

function walk (node: unknown, visit: (node: AnyNode, parent?: AnyNode) => void, parent?: AnyNode) {
    if (!node || typeof node !== 'object') {
        return
    }
    if (Array.isArray(node)) {
        for (const child of node) {
            walk(child, visit, parent)
        }
        return
    }
    const n = node as AnyNode
    if (typeof n.type !== 'string') {
        return
    }
    visit(n, parent)
    for (const [key, value] of Object.entries(n)) {
        if (key !== 'loc' && value && typeof value === 'object') {
            walk(value, visit, n)
        }
    }
}

/**
 * identifiers bound by a declaration pattern
 */
export function boundNames (pattern: AnyNode): string[] {
    switch (pattern.type) {
    case 'Identifier':
        return [pattern.name as string]
    case 'ObjectPattern':
        return (pattern.properties as AnyNode[]).flatMap((p) => boundNames((p.type === 'RestElement' ? p.argument : p.value) as AnyNode))
    case 'ArrayPattern':
        return (pattern.elements as (AnyNode | null)[]).flatMap((e) => e ? boundNames(e) : [])
    case 'RestElement':
        return boundNames(pattern.argument as AnyNode)
    case 'AssignmentPattern':
        return boundNames(pattern.left as AnyNode)
    default:
        return []
    }
}

/**
 * Whether a call chain starts at `browser`/`driver` or a `$`/`$$` call.
 */
function isWdioChain (node: AnyNode): boolean {
    let current: AnyNode | undefined = node
    while (current) {
        if (current.type === 'ChainExpression') {
            current = current.expression as AnyNode
        } else if (current.type === 'CallExpression') {
            const callee = current.callee as AnyNode
            if (callee.type === 'Identifier' && SELECTOR_FNS.has(callee.name as string)) {
                return true
            }
            current = callee
        } else if (current.type === 'MemberExpression') {
            current = current.object as AnyNode
        } else if (current.type === 'Identifier') {
            return BROWSER_NAMES.has(current.name as string)
        } else {
            return false
        }
    }
    return false
}

function isReadOnlyExpression (expr: AnyNode): boolean {
    const node = expr.type === 'AwaitExpression' ? expr.argument as AnyNode : expr
    if (['Identifier', 'Literal', 'TemplateLiteral'].includes(node.type)) {
        return true
    }
    if (node.type === 'MemberExpression') {
        return true
    }
    if (node.type !== 'CallExpression') {
        return false
    }
    const callee = node.callee as AnyNode
    if (callee.type === 'Identifier') {
        return SELECTOR_FNS.has(callee.name as string)
    }
    if (callee.type === 'MemberExpression' && !callee.computed) {
        const name = (callee.property as AnyNode).name as string
        if (SELECTOR_FNS.has(name)) {
            return true
        }
        return /^(get|is)[A-Z]/.test(name) && isWdioChain(callee.object as AnyNode)
    }
    return false
}

interface Edit {
    start: number
    end: number
    text: string
}

function importRewrite (node: AnyNode, index: number): string {
    const source = (node.source as AnyNode).raw as string
    const specifiers = node.specifiers as AnyNode[]
    const load = `await ${IMPORT_FN}(${source})`
    if (!specifiers.length) {
        return `${load};`
    }
    const tmp = `__wdioModule${index}`
    const parts = [`const ${tmp} = ${load};`]
    for (const s of specifiers) {
        const local = (s.local as AnyNode).name as string
        if (s.type === 'ImportDefaultSpecifier') {
            parts.push(`globalThis.${local} = ${tmp}.default;`)
        } else if (s.type === 'ImportNamespaceSpecifier') {
            parts.push(`globalThis.${local} = ${tmp};`)
        } else {
            const imported = s.imported as AnyNode
            const name = imported.type === 'Identifier' ? imported.name as string : imported.value as string
            parts.push(`globalThis.${local} = ${tmp}[${JSON.stringify(name)}];`)
        }
    }
    return parts.join(' ')
}

/**
 * Rewrite code so it can run as the body of an async function in a
 * persistent context (RFC §7.2):
 *
 * - top-level declarations become properties of the context
 * - static imports become dynamic imports resolved from the project
 * - the value of a trailing expression is returned
 */
export function transform (source: string): TransformResult {
    const code = stripTypes(source)
    const ast = parseCode(code)
    const edits: Edit[] = []
    const prologue: string[] = []
    const warnings: string[] = []
    const body = ast.body

    body.forEach((statement, index) => {
        let node = statement
        if (node.type === 'ExportNamedDeclaration' && node.declaration) {
            edits.push({ start: node.start, end: (node.declaration as AnyNode).start, text: '' })
            node = node.declaration as AnyNode
        } else if (node.type === 'ExportDefaultDeclaration') {
            edits.push({ start: node.start, end: (node.declaration as AnyNode).start, text: '' })
            node = node.declaration as AnyNode
        }

        if (node.type === 'VariableDeclaration') {
            const declarations = node.declarations as AnyNode[]
            edits.push({ start: node.start, end: declarations[0].start, text: '' })
            declarations.forEach((d, i) => {
                const id = d.id as AnyNode
                if (i > 0) {
                    edits.push({ start: declarations[i - 1].end, end: d.start, text: '; ' })
                }
                if (id.type === 'Identifier') {
                    edits.push({ start: id.start, end: id.start, text: 'globalThis.' })
                    if (!d.init) {
                        edits.push({ start: id.end, end: id.end, text: node.kind === 'var' ? ' ??= undefined' : ' = undefined' })
                    }
                    return
                }
                edits.push({ start: id.start, end: id.start, text: ';(' })
                edits.push({ start: d.end, end: d.end, text: d.init ? ')' : ' = undefined)' })
            })
        } else if (node.type === 'FunctionDeclaration' && node.id) {
            prologue.push(`globalThis.${(node.id as AnyNode).name} = ${(node.id as AnyNode).name};`)
        } else if (node.type === 'ClassDeclaration' && node.id) {
            edits.push({ start: node.start, end: node.start, text: `globalThis.${(node.id as AnyNode).name} = ` })
        } else if (node.type === 'ImportDeclaration') {
            edits.push({ start: node.start, end: node.end, text: importRewrite(node, index) })
        } else if (node.type === 'ExpressionStatement') {
            const expr = node.expression as AnyNode
            const isLast = index === body.length - 1
            if (isLast) {
                edits.push({ start: expr.start, end: expr.start, text: 'return (' })
                edits.push({ start: expr.end, end: node.end, text: ');' })
            } else if (expr.type !== 'AwaitExpression' && isWdioChain(expr) && expr.type !== 'Identifier' && expr.type !== 'MemberExpression') {
                warnings.push(`warn: line ${node.loc!.start.line}: WebdriverIO commands are async, add await`)
            }
        }
    })

    /**
     * dynamic `import()` anywhere resolves from the project as well
     */
    walk(ast, (node) => {
        if (node.type === 'ImportExpression') {
            edits.push({ start: node.start, end: node.start + 'import'.length, text: IMPORT_FN })
        }
    })

    let out = code
    /**
     * edits never overlap; at the same position the wider edit goes first so
     * that insertions end up in front of it
     */
    for (const edit of edits.sort((a, b) => b.start - a.start || b.end - a.end)) {
        out = out.slice(0, edit.start) + edit.text + out.slice(edit.end)
    }
    const last = body.at(-1)
    const readOnly = body.length === 1 && last!.type === 'ExpressionStatement' && isReadOnlyExpression(last!.expression as AnyNode)
    return {
        code: prologue.length ? `${prologue.join(' ')} ${out}` : out,
        warnings,
        readOnly
    }
}

export { IMPORT_FN }
