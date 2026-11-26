import path from 'node:path'

import * as acorn from 'acorn'

import type { HistoryEntry } from '../types.js'
import { SessionError } from '../errors.js'
import { PARSE_OPTIONS, stripTypes } from '../exec/transform.js'

export interface ExportOptions {
    title: string
    pageObjects?: boolean
    /**
     * when set, `browser.url` calls under this origin become path-only
     */
    baseUrl?: string
    /**
     * project directory the recorded steps ran in, and the directory the
     * spec is written to. Relative imports are rewritten from one to the other.
     */
    cwd?: string
    outDir?: string
}

export interface GeneratedFile {
    path: string
    contents: string
}

const RESERVED = new Set(['await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'implements', 'import', 'in', 'instanceof', 'interface', 'let', 'new', 'null', 'package', 'private', 'protected', 'public', 'return', 'static', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield'])

export function pageClassName (pathname: string) {
    const segment = pathname.replace(/\/+$/, '').split('/').filter(Boolean).pop() || ''
    const base = segment.replace(/\.[a-z0-9]+$/i, '')
    let name = base.split(/[^a-zA-Z0-9]+/).filter(Boolean)
        .map((part) => part[0].toUpperCase() + part.slice(1))
        .join('')
    if (!name) {
        name = 'Home'
    }
    if (/^[0-9]/.test(name) || RESERVED.has(name.toLowerCase())) {
        name = `Page${name}`
    }
    return name
}

export function pageInstanceName (page: string) {
    const raw = page[0].toLowerCase() + page.slice(1)
    return RESERVED.has(raw) ? `${raw}Page` : raw
}

/**
 * A getter name for a selector: the accessible name when the selector is
 * `aria/…` or `role/…[name="…"]`, otherwise the id, test id or text.
 */
export function getterName (selector: string) {
    let raw = selector
    if (raw.startsWith('aria/')) {
        raw = raw.slice('aria/'.length)
    } else if (raw.startsWith('role/')) {
        const role = raw.match(/^role\/([a-zA-Z]+)(?:\[name=(["'])((?:\\.|(?!\2).)*)\2\])?$/)
        raw = role?.[3]?.replace(/\\(.)/g, '$1') || role?.[1] || raw
    } else if (raw.startsWith('#') || raw.startsWith('.')) {
        raw = raw.slice(1)
    } else {
        const uiSelector = raw.match(/^android=new UiSelector\(\)\.(?:resourceId|text|description)\("((?:\\.|[^"\\])*)"\)/)
        const testid = raw.match(/data-testid=(['"])(.*?)\1/)
        const text = raw.match(/^[a-z][a-z0-9]*=(.+)$/i)
        raw = uiSelector?.[1] || testid?.[2] || text?.[1] || raw
    }
    const words = raw.replace(/[^a-zA-Z0-9]+/g, ' ').trim().split(/\s+/).filter(Boolean)
    const camel = words.map((word, i) => i === 0 ? word.toLowerCase() : word[0].toUpperCase() + word.slice(1).toLowerCase()).join('')
    if (!camel) {
        return 'element'
    }
    /**
     * a class cannot have a getter named `constructor`
     */
    return /^\d/.test(camel) || camel === 'constructor' ? `el${camel[0].toUpperCase()}${camel.slice(1)}` : camel
}

export function relativizeUrl (code: string, baseUrl?: string) {
    if (!baseUrl) {
        return code
    }
    const base = baseUrl.replace(/\/$/, '')
    return code.replaceAll(`${base}/`, '/').replaceAll(`'${base}'`, "'/'").replaceAll(`"${base}"`, '"/"')
}

function indent (code: string, spaces: number) {
    const pad = ' '.repeat(spaces)
    return code.split('\n').map((line) => line.trim() === '' ? '' : pad + line).join('\n')
}

interface SelectorUse {
    selector: string
    page: string
    getter: string
}

interface SourceNode {
    value: unknown
    start: number
    end: number
}

interface ProgramNode {
    type: string
    start: number
    end: number
    body?: ProgramNode[]
    callee?: ProgramNode
    name?: string
    arguments?: ProgramNode[]
    source?: SourceNode
    value?: unknown
    [key: string]: unknown
}

function parseProgram (code: string): ProgramNode | undefined {
    try {
        // the export reads no node location
        return acorn.parse(code, { ...PARSE_OPTIONS, locations: false }) as unknown as ProgramNode
    } catch {
        return undefined
    }
}

function walk (node: ProgramNode | undefined, visit: (node: ProgramNode) => void) {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') {
        return
    }
    visit(node)
    for (const value of Object.values(node)) {
        if (Array.isArray(value)) {
            for (const child of value) {
                if (child && typeof child === 'object' && typeof (child as ProgramNode).type === 'string') {
                    walk(child as ProgramNode, visit)
                }
            }
        } else if (value && typeof value === 'object' && typeof (value as ProgramNode).type === 'string') {
            walk(value as ProgramNode, visit)
        }
    }
}

function relativeImport (source: string, fromDir: string, toDir: string) {
    const absolute = path.resolve(fromDir, source)
    let next = path.relative(toDir, absolute).split(path.sep).join('/')
    if (!next.startsWith('.')) {
        next = `./${next}`
    }
    return next
}

function splitImports (code: string, fromDir?: string, toDir?: string) {
    const ast = parseProgram(code)
    if (!ast?.body) {
        return { imports: [] as string[], locals: [] as string[], body: code }
    }
    const ranges = ast.body.filter((node) => node.type === 'ImportDeclaration')
    let body = code
    const imports: string[] = []
    const locals = ranges.flatMap((node) => (node.specifiers as { local: { name: string } }[]).map((specifier) => specifier.local.name))
    for (const node of [...ranges].reverse()) {
        let text = code.slice(node.start, node.end).trim()
        const source = node.source
        if (fromDir && toDir && source && typeof source.value === 'string' && (source.value.startsWith('./') || source.value.startsWith('../'))) {
            const next = relativeImport(source.value, fromDir, toDir)
            const quoted = code.slice(source.start, source.end)
            text = `${text.slice(0, source.start - node.start)}${quoted[0]}${next}${quoted[0]}${text.slice(source.end - node.start)}`
        }
        imports.unshift(text)
        body = `${body.slice(0, node.start)}${body.slice(node.end)}`
    }
    return { imports, locals, body: body.trim() }
}

function rewriteDynamicImports (code: string, fromDir?: string, toDir?: string) {
    if (!fromDir || !toDir) {
        return code
    }
    const ast = parseProgram(code)
    if (!ast) {
        return code
    }
    const edits: { start: number, end: number, next: string }[] = []
    walk(ast, (node) => {
        if (node.type !== 'ImportExpression' || !node.source || typeof node.source.value !== 'string') {
            return
        }
        if (!node.source.value.startsWith('./') && !node.source.value.startsWith('../')) {
            return
        }
        const quoted = code.slice(node.source.start, node.source.end)
        edits.push({
            start: node.source.start,
            end: node.source.end,
            next: `${quoted[0]}${relativeImport(node.source.value, fromDir, toDir)}${quoted[0]}`
        })
    })
    let out = code
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
        out = `${out.slice(0, edit.start)}${edit.next}${out.slice(edit.end)}`
    }
    return out
}

interface SelectorEdit {
    start: number
    end: number
    selector: string
}

/**
 * Names bound by a pattern or assignment target: `name`, `[name]`,
 * `{ key: name }`, `name = fallback`, `...name`.
 * A member such as `el.$$` writes a property, not a binding.
 */
function collectBoundNames (node: ProgramNode | undefined | null, names: string[] = []): string[] {
    if (!node) {
        return names
    }
    switch (node.type) {
    case 'Identifier':
        if (node.name) {
            names.push(node.name)
        }
        break
    case 'ArrayPattern':
        for (const element of node.elements as (ProgramNode | null)[]) {
            collectBoundNames(element, names)
        }
        break
    case 'ObjectPattern':
        for (const property of node.properties as ProgramNode[]) {
            collectBoundNames((property.type === 'RestElement' ? property.argument : property.value) as ProgramNode, names)
        }
        break
    case 'AssignmentPattern':
        collectBoundNames(node.left as ProgramNode, names)
        break
    case 'RestElement':
        collectBoundNames(node.argument as ProgramNode, names)
        break
    }
    return names
}

/**
 * Whether an assignment target writes `name`: `name`, `[name]`, `{ key: name }`, `name = fallback`, `...name`.
 * A member such as `el.$$` writes a property, not a binding.
 */
function writes (node: ProgramNode | undefined | null, name: string): boolean {
    return collectBoundNames(node).includes(name)
}

/**
 * The target that a node writes: `x = …`, `x++`, `for (x of …)`. `for (const x of …)` declares a new binding.
 */
function assignmentTarget (node: ProgramNode) {
    switch (node.type) {
    case 'AssignmentExpression':
        return node.left as ProgramNode
    case 'UpdateExpression':
        return node.argument as ProgramNode
    case 'ForOfStatement':
    case 'ForInStatement':
        return (node.left as ProgramNode).type === 'VariableDeclaration' ? undefined : node.left as ProgramNode
    default:
        return undefined
    }
}

// `$$` that is not a member name (`el.$$`); a spread (`...$$`) is a reference
const DOLLAR_DOLLAR_TEXT = /(?<![\w$])(?<!(?:^|[^.])\.)\$\$(?![\w$])/
const DOLLAR_DOLLAR_ASSIGN_TEXT = /(?<![\w$.])\$\$\s*(?:(?:\*\*|<<|>>>?|&&|\|\||\?\?|[-+*/%&|^])?=(?![=>])|\+\+|--)|(?:\+\+|--)[ \t]*\$\$(?![\w$])/

function selectorEdits (code: string) {
    const ast = parseProgram(stripTypes(code))
    const edits: SelectorEdit[] = []
    let needsDollar = false
    let needsDollarDollar = false
    let assignsDollarDollar = false
    if (!ast) {
        return {
            edits,
            needsDollar: /(?<!\$)\$\(/.test(code),
            needsDollarDollar: DOLLAR_DOLLAR_TEXT.test(code),
            assignsDollarDollar: DOLLAR_DOLLAR_ASSIGN_TEXT.test(code),
            // the text cannot show every declaration form, so the steps get the block
            declaresDollarDollar: true
        }
    }
    // a top-level `let $$`, `const $$` or `class $$` of a step would clash with the `var $$` copy,
    // and the copy would overwrite a hoisted `function $$`
    const declaresDollarDollar = (ast.body || []).some((node) => (
        (node.type === 'VariableDeclaration' && node.kind !== 'var' && (node.declarations as ProgramNode[]).some((declarator) => writes(declarator.id as ProgramNode, '$$'))) ||
        ((node.type === 'ClassDeclaration' || node.type === 'FunctionDeclaration') && (node.id as ProgramNode | undefined)?.name === '$$')
    ))
    // a key or a member name is not a reference to the global
    const names = new Set<unknown>()
    walk(ast, (node) => {
        if (node.type === 'MemberExpression' && !node.computed) {
            names.add(node.property)
        }
        if ((node.type === 'Property' || node.type === 'MethodDefinition' || node.type === 'PropertyDefinition') && !node.computed) {
            names.add(node.key)
        }
        if (node.type === 'Identifier' && node.name === '$$' && !names.has(node)) {
            needsDollarDollar = true
        }
        if (writes(assignmentTarget(node), '$$')) {
            assignsDollarDollar = true
        }
        if (node.type !== 'CallExpression' || node.callee?.type !== 'Identifier' || node.callee.name !== '$') {
            return
        }
        const arg = node.arguments?.[0]
        if (!arg || node.arguments?.length !== 1 || arg.type !== 'Literal' || typeof arg.value !== 'string') {
            needsDollar = true
            return
        }
        edits.push({ start: node.start, end: node.end, selector: arg.value })
    })
    return { edits, needsDollar, needsDollarDollar, assignsDollarDollar, declaresDollarDollar }
}

const SCOPE_BOUNDARY_TYPES = new Set([
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
    'ClassDeclaration',
    'ClassExpression',
    'StaticBlock'
])

interface ScopeDeclaration {
    node: ProgramNode
    parentFor?: ProgramNode
}

function collectNestedVarDeclarations (node: ProgramNode | undefined | null, out: ScopeDeclaration[], parentFor?: ProgramNode) {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string' || SCOPE_BOUNDARY_TYPES.has(node.type)) {
        return
    }
    if (node.type === 'VariableDeclaration') {
        if (node.kind === 'var') {
            out.push({ node, parentFor })
        }
        return
    }
    if (node.type === 'ForStatement') {
        collectNestedVarDeclarations(node.init as ProgramNode | undefined, out, node)
        collectNestedVarDeclarations(node.body as ProgramNode | undefined, out)
        return
    }
    if (node.type === 'ForInStatement' || node.type === 'ForOfStatement') {
        collectNestedVarDeclarations(node.left as ProgramNode | undefined, out, node)
        collectNestedVarDeclarations(node.body as ProgramNode | undefined, out)
        return
    }
    for (const [key, value] of Object.entries(node)) {
        if (key === 'type' || key === 'start' || key === 'end') {
            continue
        }
        if (Array.isArray(value)) {
            for (const child of value) {
                collectNestedVarDeclarations(child as ProgramNode | undefined, out)
            }
        } else if (value && typeof value === 'object') {
            collectNestedVarDeclarations(value as ProgramNode, out)
        }
    }
}

function collectScopeDeclarations (ast: ProgramNode): ScopeDeclaration[] {
    const out: ScopeDeclaration[] = []
    for (const stmt of ast.body || []) {
        if (stmt.type === 'VariableDeclaration') {
            out.push({ node: stmt })
        } else if ((stmt.type === 'FunctionDeclaration' || stmt.type === 'ClassDeclaration') && (stmt.id as ProgramNode | undefined)?.name) {
            out.push({ node: stmt })
        } else {
            collectNestedVarDeclarations(stmt, out)
        }
    }
    return out
}

function declarationNames (node: ProgramNode): string[] {
    if (node.type === 'VariableDeclaration') {
        return (node.declarations as ProgramNode[]).flatMap((d) => collectBoundNames(d.id as ProgramNode))
    }
    const id = node.id as ProgramNode | undefined
    return id?.name ? [id.name] : []
}

function needsLeadingSemicolon (code: string, pos: number) {
    let i = pos - 1
    while (i >= 0 && /\s/.test(code[i])) {
        i--
    }
    return i < 0 || (code[i] !== ';' && code[i] !== '{')
}

interface TextEdit {
    start: number
    end: number
    text: string
}

/**
 * Each recorded `exec` step runs in its own wrapper and promotes top-level
 * declarations to globals, so two steps can both declare `const heading = …`.
 * When pasted into one `it()` body, downgrade the first `const` to `let` and
 * turn later declarations of the same binding into assignments.
 */
function dedupeDeclarations (steps: string[]): string[] {
    const parsed = steps.map((code) => {
        const ast = parseProgram(stripTypes(code))
        return { code, decls: ast ? collectScopeDeclarations(ast) : [] }
    })

    const declared = new Set<string>()
    const redeclared = new Set<string>()
    for (const { decls } of parsed) {
        for (const { node } of decls) {
            for (const name of declarationNames(node)) {
                if (declared.has(name)) {
                    redeclared.add(name)
                } else {
                    declared.add(name)
                }
            }
        }
    }

    if (!redeclared.size) {
        return steps
    }

    const seen = new Set<string>()
    return parsed.map(({ code, decls }) => {
        if (!decls.length) {
            return code
        }
        const edits: TextEdit[] = []
        for (const { node, parentFor } of decls) {
            if (node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
                const name = (node.id as ProgramNode).name!
                if (seen.has(name)) {
                    const tail = code.slice(node.end).trimStart()
                    const semi = tail.startsWith(';') ? '' : ';'
                    edits.push({ start: node.start, end: node.end, text: `${name} = ${code.slice(node.start, node.end)}${semi}` })
                } else {
                    seen.add(name)
                }
                continue
            }

            if (node.type !== 'VariableDeclaration') {
                continue
            }
            const declarators = node.declarations as ProgramNode[]
            const allNames = declarators.flatMap((d) => collectBoundNames(d.id as ProgramNode))
            if (allNames.every((name) => !seen.has(name))) {
                allNames.forEach((name) => seen.add(name))
                if (node.kind === 'const' && allNames.some((name) => redeclared.has(name))) {
                    edits.push({ start: node.start, end: node.start + 'const'.length, text: 'let' })
                }
                continue
            }

            if (parentFor) {
                const fresh = allNames.filter((name) => !seen.has(name))
                fresh.forEach((name) => seen.add(name))
                if (fresh.length) {
                    edits.push({ start: parentFor.start, end: parentFor.start, text: `let ${fresh.join(', ')}; ` })
                }
                if (parentFor.type === 'ForStatement') {
                    const exprs = declarators
                        .filter((d) => d.init)
                        .map((d) => {
                            const id = d.id as ProgramNode
                            const init = d.init as ProgramNode
                            const assign = `${code.slice(id.start, id.end)} = ${code.slice(init.start, init.end)}`
                            return id.type === 'ObjectPattern' ? `(${assign})` : assign
                        })
                    edits.push({ start: node.start, end: node.end, text: exprs.join(', ') })
                } else {
                    edits.push({ start: node.start, end: declarators[0].start, text: '' })
                }
                continue
            }

            const lastDecl = declarators[declarators.length - 1]
            const trailingSemi = code.slice(lastDecl.end, node.end)
            const parts: string[] = []
            for (const declarator of declarators) {
                const id = declarator.id as ProgramNode
                const init = declarator.init as ProgramNode | null | undefined
                const names = collectBoundNames(id)
                const reused = names.some((name) => seen.has(name))
                if (!reused) {
                    names.forEach((name) => seen.add(name))
                    const kind = node.kind === 'const' && names.some((name) => redeclared.has(name)) ? 'let' : String(node.kind)
                    parts.push(`${kind} ${code.slice(declarator.start, declarator.end)}`)
                    continue
                }
                const fresh = names.filter((name) => !seen.has(name))
                fresh.forEach((name) => seen.add(name))
                if (id.type === 'Identifier') {
                    if (init) {
                        parts.push(`${id.name} = ${code.slice(init.start, init.end)}`)
                    } else if (node.kind !== 'var') {
                        parts.push(`${id.name} = undefined`)
                    }
                    continue
                }
                const pattern = code.slice(id.start, id.end)
                const rhs = init ? code.slice(init.start, init.end) : 'undefined'
                const assign = id.type === 'ObjectPattern' ? `(${pattern} = ${rhs})` : `${pattern} = ${rhs}`
                parts.push(fresh.length ? `let ${fresh.join(', ')}; ${assign}` : assign)
            }

            if (!parts.length) {
                edits.push({ start: node.start, end: node.end, text: '' })
                continue
            }

            const multiline = code.slice(node.start, node.end).includes('\n')
            const separator = multiline ? '\n' : '; '
            const formatted = parts.map((part, index) => {
                const startsRisky = part.startsWith('(') || part.startsWith('[')
                if (!startsRisky) {
                    return part
                }
                if (index === 0 ? needsLeadingSemicolon(code, node.start) : multiline) {
                    return `;${part}`
                }
                return part
            }).join(separator)
            edits.push({ start: node.start, end: node.end, text: `${formatted}${trailingSemi}` })
        }

        if (!edits.length) {
            return code
        }
        let out = code
        for (const edit of edits.sort((a, b) => b.start - a.start || b.end - a.end)) {
            out = `${out.slice(0, edit.start)}${edit.text}${out.slice(edit.end)}`
        }
        return out.trim()
    })
}

export function generateSpec (entries: HistoryEntry[], opts: ExportOptions): GeneratedFile[] {
    const steps = entries.filter((entry) => entry.code.trim())
    for (const entry of steps) {
        if (/\bref\s*\(/.test(entry.code)) {
            throw new SessionError('EXEC_ERROR', `Step ${entry.n} still contains ref().`, {
                hint: 'Refs are rewritten when the step runs. Re-run the step after a snapshot, or remove the ref() call.'
            })
        }
    }
    const base = opts.baseUrl?.replace(/\/$/, '')
    const uses = new Map<string, SelectorUse>()
    const taken = new Map<string, Set<string>>()
    const hoisted: string[] = []
    const imported = new Set<string>()
    let needsDollar = false
    let needsDollarDollar = false
    let assignsDollarDollar = false
    let declaresDollarDollar = false
    const rendered = steps.map((entry) => {
        let code = entry.kind === 'marker'
            ? entry.code.split('\n').map((line) => line.startsWith('//') ? line : `// ${line}`).join('\n')
            : entry.code
        if (entry.kind === 'open') {
            code = relativizeUrl(code, base)
        }
        if (entry.kind === 'marker') {
            return code
        }
        const split = splitImports(code, opts.cwd, opts.outDir)
        hoisted.push(...split.imports)
        split.locals.forEach((name) => imported.add(name))
        code = rewriteDynamicImports(split.body, opts.cwd, opts.outDir)
        // without page objects the scan can only add the `$$` import
        if (!opts.pageObjects && !code.includes('$$')) {
            return code
        }
        const found = selectorEdits(code)
        needsDollar = needsDollar || found.needsDollar
        needsDollarDollar = needsDollarDollar || found.needsDollarDollar
        assignsDollarDollar = assignsDollarDollar || found.assignsDollarDollar
        declaresDollarDollar = declaresDollarDollar || found.declaresDollarDollar
        if (!opts.pageObjects) {
            return code
        }
        const page = pageClassName(entry.path || '/')
        const ordered = [...found.edits].sort((a, b) => b.start - a.start)
        for (const edit of ordered) {
            const key = `${page}\0${edit.selector}`
            let use = uses.get(key)
            if (!use) {
                const names = taken.get(page) || new Set<string>()
                let getter = getterName(edit.selector)
                const baseName = getter
                let n = 2
                while (names.has(getter)) {
                    getter = `${baseName}${n++}`
                }
                names.add(getter)
                taken.set(page, names)
                use = { selector: edit.selector, page, getter }
                uses.set(key, use)
            }
            const instance = pageInstanceName(use.page)
            code = `${code.slice(0, edit.start)}${instance}.${use.getter}${code.slice(edit.end)}`
        }
        return code
    })

    const renderedSteps = dedupeDeclarations(rendered).filter((step) => step.trim())

    const pages = [...new Set([...uses.values()].map((use) => use.page))]
    const importDollarDollar = needsDollarDollar && !imported.has('$$')
    // an ES import is read-only, so a step that assigns `$$` gets a `var` copy of the import
    const mutableDollarDollar = importDollarDollar && assignsDollarDollar
    let dollarDollarAlias = '__wdioDollarDollar'
    if (mutableDollarDollar) {
        const recordedCode = steps.map((entry) => entry.code).join('\n')
        while (new RegExp(`\\b${dollarDollarAlias}\\b`).test(recordedCode)) {
            dollarDollarAlias += '_'
        }
    }
    const dollars = [
        !opts.pageObjects || needsDollar ? '$' : '',
        importDollarDollar ? (mutableDollarDollar ? `$$ as ${dollarDollarAlias}` : '$$') : ''
    ].filter(Boolean)
    const imports = [
        `import { browser${dollars.length ? `, ${dollars.join(', ')}` : ''}, expect } from '@wdio/globals'`,
        ...[...new Set(hoisted)],
        ...pages.map((page) => `import ${page}Page from './pageobjects/${page}.page.ts'`)
    ]
    const instances = pages.map((page) => `const ${pageInstanceName(page)} = new ${page}Page()`)
    // a block keeps a step's own `let $$` or `const $$` from clashing with the `var $$` copy
    const body = [
        ...instances,
        // the semicolon stops a first step that starts with `(` or `[` from continuing this line
        ...(mutableDollarDollar ? [`var $$ = ${dollarDollarAlias};`] : []),
        ...(mutableDollarDollar && declaresDollarDollar ? [`{\n${indent(renderedSteps.join('\n\n'), 4)}\n}`] : renderedSteps)
    ].filter(Boolean)
    const title = opts.title.replace(/'/g, "\\'")
    const spec = [
        ...imports,
        '',
        `describe('${title}', () => {`,
        `    it('${title}', async () => {`,
        indent(body.join('\n\n'), 8),
        '    })',
        '})',
        ''
    ].join('\n')

    const files: GeneratedFile[] = [{ path: 'spec.ts', contents: spec }]
    for (const page of pages) {
        const getters = [...uses.values()].filter((use) => use.page === page)
        const contents = [
            "import { $ } from '@wdio/globals'",
            '',
            `export default class ${page}Page {`,
            ...getters.map((use) => `    get ${use.getter} () { return $(${JSON.stringify(use.selector)}) }`),
            '}',
            ''
        ].join('\n')
        files.push({ path: `pageobjects/${page}.page.ts`, contents })
    }
    return files
}
