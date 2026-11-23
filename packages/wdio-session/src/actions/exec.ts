import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

import logger from '@wdio/logger'

import { EXEC_INLINE_LIMIT } from '../constants.js'
import { SessionError } from '../errors.js'
import { getExecContext } from '../exec/context.js'
import { hintFor } from '../exec/hints.js'
import { isError, serialize, type ElementInfo } from '../exec/serialize.js'
import { parseCode, stripTypes, transform } from '../exec/transform.js'
import { quote } from '../quote.js'
import type { ActionFn, Session } from '../session.js'
import { scopeOf } from '../snapshot/target.js'

const log = logger('@wdio/session:exec')

/**
 * tag, short accessible name and ref of a web element, in one round trip
 */
/* c8 ignore start: runs in the browser */
function describeInPage (el: HTMLElement) {
    const collapse = (s: string | null | undefined) => (s || '').replace(/\s+/g, ' ').trim()
    const labelled = el.getAttribute('aria-labelledby')
    const byId = labelled ? labelled.split(/\s+/).map((id) => document.getElementById(id)?.textContent).join(' ') : ''
    const labels = (el as HTMLInputElement).labels
    const name = collapse(byId) || collapse(el.getAttribute('aria-label')) ||
        collapse(labels && labels.length ? labels[0].textContent : '') ||
        collapse(el.getAttribute('alt')) || collapse(el.getAttribute('title')) ||
        collapse(el.getAttribute('placeholder')) || collapse(el.innerText || el.textContent)
    const store = (window as unknown as { __wdioSession?: { ids: WeakMap<Element, string> } }).__wdioSession
    return {
        tag: el.tagName.toLowerCase(),
        name: name.length > 80 ? `${name.slice(0, 79)}…` : name,
        ref: store?.ids.get(el) || ''
    }
}
/* c8 ignore stop */

async function describeElement (session: Session, el: WebdriverIO.Element): Promise<ElementInfo> {
    if (session.isWeb && !session.applies.includes('M')) {
        return scopeOf(session).execute(describeInPage, el as unknown as HTMLElement)
    }
    const tag = await el.getTagName().catch(() => undefined)
    const name = await el.getText().catch(() => undefined)
    return { tag, name: name?.slice(0, 80) }
}

/** AST traversal ensures rewrites never change string literals or comments. */
type CodeNode = { type: string, start: number, end: number, [key: string]: unknown }

function walkCode (value: unknown, visit: (node: CodeNode, parent?: CodeNode, key?: string) => void, parent?: CodeNode, key?: string): void {
    if (!value || typeof value !== 'object') {
        return
    }
    if (Array.isArray(value)) {
        for (const child of value) {
            walkCode(child, visit, parent, key)
        }
        return
    }
    const node = value as CodeNode
    if (typeof node.type !== 'string') {
        return
    }
    visit(node, parent, key)
    for (const [name, child] of Object.entries(node)) {
        if (name !== 'loc') {
            walkCode(child, visit, node, name)
        }
    }
}

function applyCodeEdits (code: string, edits: { start: number, end: number, text: string }[]): string {
    let result = code
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
        result = result.slice(0, edit.start) + edit.text + result.slice(edit.end)
    }
    return result
}

/**
 * Replace literal and input-argument element refs with stable selectors.
 * Only refs resolved during the call are eligible for substitution.
 */
export async function rewriteRefs (session: Session, code: string, used: Map<string, WebdriverIO.Element>, inputArgs?: readonly unknown[]) {
    const selectors = new Map<string, string>()
    for (const [id, el] of used) {
        const selector = await session.refs.stableSelector(scopeOf(session), id, el).catch(() => undefined)
        if (selector) {
            selectors.set(id, selector)
        }
    }
    const edits: { start: number, end: number, text: string }[] = []
    walkCode(parseCode(stripTypes(code)), (node) => {
        if (node.type !== 'CallExpression') {
            return
        }
        const callee = node.callee as CodeNode
        const argument = (node.arguments as CodeNode[] | undefined)?.[0]
        if (callee?.type !== 'Identifier' || callee.name !== 'ref' || !argument) {
            return
        }
        let id: string | undefined
        if (argument.type === 'Literal' && typeof argument.value === 'string') {
            id = argument.value
        } else if (argument.type === 'MemberExpression' && argument.computed === true) {
            const object = argument.object as CodeNode
            const property = argument.property as CodeNode
            if (object.type === 'Identifier' && object.name === 'args' && property.type === 'Literal' &&
                typeof property.value === 'number' && Number.isInteger(property.value) && property.value >= 0) {
                const value = inputArgs?.[property.value]
                id = typeof value === 'string' ? value : undefined
            }
        }
        const selector = id === undefined ? undefined : selectors.get(id)
        if (selector) {
            edits.push({ start: node.start, end: node.end, text: '$(' + quote(selector) + ')' })
        }
    })
    return applyCodeEdits(code, edits)
}

/**
 * Give each recorded exec call a distinct args binding, preserving closures
 * that may be invoked by subsequent recorded calls in a single test.
 */
function bindRecordedArgs (code: string, binding: string): string {
    const edits: { start: number, end: number, text: string }[] = []
    walkCode(parseCode(stripTypes(code)), (node, parent, key) => {
        if (node.type !== 'Identifier' || node.name !== 'args') {
            return
        }
        if (parent?.type === 'MemberExpression' && key === 'property' && parent.computed !== true) {
            return
        }
        if (parent?.type === 'Property' && key === 'key' && parent.computed !== true) {
            return
        }
        if ((parent?.type === 'MethodDefinition' && key === 'key') ||
            (parent?.type === 'LabeledStatement' && key === 'label')) {
            return
        }
        const text = parent?.type === 'Property' && key === 'value' && parent.shorthand === true
            ? 'args: ' + binding
            : binding
        edits.push({ start: node.start, end: node.end, text })
    })
    return applyCodeEdits(code, edits)
}

/** time left for the reply when the code runs out of time */
const TIMEOUT_MARGIN_MS = 1000

/**
 * The code's result, or a timeout error a little before the server's that
 * includes what the code printed so far: a loop that set five sliders and
 * ran out of time on the sixth still says what it did.
 */
async function withinTimeout<T> (running: Promise<T>, timeout: number, margin: number, lines: string[], onTimeout: () => void): Promise<T> {
    if (!Number.isFinite(timeout) || timeout <= margin * 2) {
        return running
    }
    let timer: NodeJS.Timeout | undefined
    try {
        return await Promise.race([
            running,
            new Promise<never>((_, reject) => {
                timer = setTimeout(() => {
                    const output = [...lines]
                    onTimeout()
                    reject(new SessionError('TIMEOUT', `"exec" did not finish within ${timeout}ms; the code may still be running.`, {
                        hint: 'Split the work into smaller steps, or pass --timeout.',
                        details: output.length ? ['Output so far:', ...output].join('\n') : undefined
                    }))
                }, timeout - margin)
            })
        ])
    } finally {
        clearTimeout(timer)
    }
}

export const exec: ActionFn = async (session, args) => {
    const source = String(args.code ?? args.e ?? '')
    const filename = typeof args.filename === 'string' ? args.filename : undefined
    const { code, warnings, readOnly } = transform(source)
    const ctx = await getExecContext(session)
    const lines: string[] = [...warnings]
    ctx.setSink((line) => lines.push(line))
    ctx.setBaseDir(filename ? path.dirname(filename) : args.$cwd)
    ctx.usedRefs.clear()

    let input: string | undefined
    let value: unknown
    try {
        if (args.args !== undefined) {
            if (!Array.isArray(args.args)) {
                throw new TypeError('Exec args must be an array of JSON values.')
            }
            input = `JSON.parse(${JSON.stringify(JSON.stringify(args.args))})`
        }
        const script = new vm.Script(`(async (${input ? 'args' : ''}) => {${code}\n})(${input ?? ''})`, { filename: filename || 'exec.js' })
        const running = script.runInContext(ctx.context) as Promise<unknown>
        session.trackPending(`exec-${Date.now()}`, running.then(
            () => undefined,
            (err) => log.debug(`exec failed: ${err?.message}`)
        ))
        const timeout = typeof args.$timeout === 'number' ? args.$timeout : 0
        const margin = args.$agent ? 0 : TIMEOUT_MARGIN_MS
        value = await withinTimeout(running, timeout, margin, lines, () => {
            /**
             * The code can't be stopped. Given up on, it no longer changes the
             * session (see `Session.abandon`), and what it prints later is
             * dropped rather than shown with the next command.
             */
            session.abandon?.()
            ctx.setSink(() => {})
        })
        if (isError(value)) {
            throw value
        }
    } catch (err) {
        if (err instanceof SessionError) {
            throw err
        }
        const e = isError(err) ? err : new Error(String(err))
        const name = e.name && e.name !== 'Error' ? e.name : 'Error'
        const message = e.message.split('\n')[0]
        throw new SessionError('EXEC_ERROR', `${name}: ${message}`, {
            hint: hintFor(e, session.cmd),
            details: [...lines, ...(['debug', 'trace'].includes(session.plan.remote.logLevel || '') ? [e.stack || ''] : [])].filter(Boolean).join('\n') || undefined
        })
    }

    const rendered = await serialize(value, { describeElement: (el) => describeElement(session, el) })
    let text = [...lines, rendered.text].filter((l) => l !== '').join('\n')
    const files: string[] = []
    if (Buffer.byteLength(text) > EXEC_INLINE_LIMIT) {
        const file = session.artifact('exec', `${session.timestamp()}.txt`)
        fs.writeFileSync(file, text)
        files.push(file)
        text = `${text.slice(0, 4000)}\n… (output is ${Buffer.byteLength(text)} bytes, full output in ${file})`
    }

    const record = args.history !== false && !readOnly
    const rewritten = record ? await rewriteRefs(session, source.trim(), ctx.usedRefs, Array.isArray(args.args) ? args.args : undefined) : undefined
    return {
        text,
        data: { value: rendered.value, logs: lines },
        files,
        // Each recorded call captures independent arguments, including in closures.
        history: rewritten && input
            ? (() => {
                const binding = `__wdioExecArgs_${session.history.entries.length}`
                return `const ${binding} = ${input};\n${bindRecordedArgs(rewritten, binding)}`
            })()
            : rewritten
    }
}
