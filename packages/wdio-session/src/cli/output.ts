import { SessionError } from '../errors.js'
import type { ActionResult } from '../types.js'

export interface OutputOptions {
    json?: boolean
    quiet?: boolean
    color?: boolean
    session: string
    action: string
    mutation?: boolean
    stdout?: NodeJS.WritableStream
    stderr?: NodeJS.WritableStream
}

const paint = (enabled: boolean | undefined, code: number, text: string) => enabled ? `\u001b[${code}m${text}\u001b[0m` : text

export function useColor (flag: unknown, stream: NodeJS.WriteStream = process.stdout, env = process.env) {
    if (flag === false || env.NO_COLOR) {
        return false
    }
    return Boolean(stream.isTTY)
}

export function renderResult (result: ActionResult, opts: OutputOptions) {
    if (opts.json) {
        return JSON.stringify({ ok: true, session: opts.session, action: opts.action, result }) + '\n'
    }
    if (opts.quiet && opts.mutation) {
        return ''
    }
    const lines: string[] = []
    if (result.text) {
        lines.push(result.text)
    }
    if (result.code && !opts.quiet) {
        lines.push(paint(opts.color, 2, `→ ${result.code}`))
    }
    return lines.length ? lines.join('\n') + '\n' : ''
}

export function renderError (err: SessionError, opts: OutputOptions) {
    if (opts.json) {
        return JSON.stringify({ ok: false, session: opts.session, action: opts.action, error: err.toJSON() }) + '\n'
    }
    const lines = [paint(opts.color, 31, `✖ ${err.message}`)]
    if (err.details) {
        lines.push('', ...err.details.split('\n').map((l) => `  ${l}`))
    }
    if (err.install?.length) {
        lines.push('')
        const labels = ['Install it in your project:', 'Then run:']
        const width = Math.max(...labels.slice(0, err.install.length).map((l) => l.length)) + 2
        err.install.forEach((cmd, i) => {
            lines.push(`  ${(labels[Math.min(i, 1)]).padEnd(width)}${cmd}`)
        })
    }
    if (err.hint) {
        lines.push('', `  ${err.hint}`)
    }
    return lines.join('\n') + '\n'
}

export function printResult (result: ActionResult, opts: OutputOptions) {
    const out = renderResult(result, opts)
    if (out) {
        (opts.stdout || process.stdout).write(out)
    }
}

/**
 * Print an error and return the exit code to use.
 */
export function printError (error: unknown, opts: OutputOptions) {
    const err = SessionError.from(error)
    const out = renderError(err, opts)
    ;(opts.json ? (opts.stdout || process.stdout) : (opts.stderr || process.stderr)).write(out)
    return err.exitCode
}
