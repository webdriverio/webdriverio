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
 * Whether an assignment target writes `name`: `name`, `[name]`, `{ key: name }`, `name = fallback`, `...name`.
 * A member such as `el.$$` writes a property, not a binding.
 */
function writes (node: ProgramNode | undefined | null, name: string): boolean {
    if (!node) {
        return false
    }
    switch (node.type) {
    case 'Identifier':
        return node.name === name
    case 'ArrayPattern':
        return (node.elements as (ProgramNode | null)[]).some((element) => writes(element, name))
    case 'ObjectPattern':
        return (node.properties as ProgramNode[]).some((property) => writes((property.type === 'RestElement' ? property.argument : property.value) as ProgramNode, name))
    case 'AssignmentPattern':
        return writes(node.left as ProgramNode, name)
    case 'RestElement':
        return writes(node.argument as ProgramNode, name)
    default:
        return false
    }
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
        ...(mutableDollarDollar && declaresDollarDollar ? [`{\n${indent(rendered.join('\n\n'), 4)}\n}`] : rendered)
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
