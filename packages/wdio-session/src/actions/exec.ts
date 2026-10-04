import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'

import logger from '@wdio/logger'

import { EXEC_INLINE_LIMIT } from '../constants.js'
import { SessionError } from '../errors.js'
import { getExecContext } from '../exec/context.js'
import { hintFor } from '../exec/hints.js'
import { isError, serialize, type ElementInfo } from '../exec/serialize.js'
import { transform } from '../exec/transform.js'
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

/**
 * Replace `ref('eN')` with the stable selector of the element it resolved to.
 */
export async function rewriteRefs (session: Session, code: string, used: Map<string, WebdriverIO.Element>) {
    let out = code
    for (const [id, el] of used) {
        const selector = await session.refs.stableSelector(scopeOf(session), id, el).catch(() => undefined)
        if (selector) {
            out = out.replace(new RegExp(`\\bref\\((['"\`])${id}\\1\\)`, 'g'), `$(${quote(selector)})`)
        }
    }
    return out
}

/** time left for the reply when the code runs out of time */
const TIMEOUT_MARGIN_MS = 1000

/**
 * The code's result, or a timeout error a little before the server's that
 * includes what the code printed so far: a loop that set five sliders and
 * ran out of time on the sixth still says what it did.
 */
async function withinTimeout<T> (running: Promise<T>, timeout: number | undefined, lines: string[], onTimeout: () => void): Promise<T> {
    if (!timeout || timeout <= TIMEOUT_MARGIN_MS * 2) {
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
                }, timeout - TIMEOUT_MARGIN_MS)
            })
        ])
    } finally {
        clearTimeout(timer)
    }
}

export const exec: ActionFn = async (session, args) => {
    const source = String(args.code ?? '')
    const filename = typeof args.filename === 'string' ? args.filename : undefined
    const { code, warnings, readOnly } = transform(source)
    const ctx = await getExecContext(session)
    const lines: string[] = [...warnings]
    ctx.setSink((line) => lines.push(line))
    ctx.setBaseDir(filename ? path.dirname(filename) : args.$cwd)
    ctx.usedRefs.clear()

    const script = new vm.Script(`(async () => {${code}\n})()`, { filename: filename || 'exec.js' })
    let value: unknown
    try {
        const running = script.runInContext(ctx.context) as Promise<unknown>
        session.trackPending(`exec-${Date.now()}`, running.then(
            () => undefined,
            (err) => log.debug(`exec failed: ${err?.message}`)
        ))
        value = await withinTimeout(running, typeof args.$timeout === 'number' ? args.$timeout : undefined, lines, () => {
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
            hint: hintFor(e),
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
    return {
        text,
        data: { value: rendered.value, logs: lines },
        files,
        history: record ? await rewriteRefs(session, source.trim(), ctx.usedRefs) : undefined
    }
}
