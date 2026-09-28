import repl from 'node:repl'
import util from 'node:util'

import { send } from '@wdio/session'

/**
 * A REPL whose input is `wdio session exec` against an already running
 * session. `.exit` detaches and leaves the browser up (RFC §12.1).
 *
 * Piped stdin delivers `.exit` before an async `eval` callback runs, and
 * the process exits with the callback. Hold the close until every in-flight
 * `exec` has printed.
 */
export function attachRepl (name: string, opts: { input?: NodeJS.ReadableStream, output?: NodeJS.WritableStream } = {}) {
    const output = opts.output || process.stdout
    const input = opts.input || process.stdin
    const tty = Boolean((output as NodeJS.WriteStream).isTTY)
    return new Promise<void>((resolve) => {
        let pending = 0
        let closing = false
        let originalClose = () => {}
        const server = repl.start({
            prompt: tty ? `wdio:${name}> ` : '',
            input,
            output,
            terminal: tty,
            ignoreUndefined: true,
            writer: (value: unknown) => typeof value === 'string' ? value : util.inspect(value),
            eval: (cmd, _context, _filename, callback) => {
                const code = cmd.replace(/\n$/, '').trim()
                if (!code) {
                    callback(null, undefined)
                    return
                }
                pending++
                send(name, 'exec', { code, history: false }).then((result) => {
                    const lines = [result.text, result.code ? `→ ${result.code}` : ''].filter(Boolean)
                    callback(null, lines.join('\n') || undefined)
                }, (err: Error) => callback(err, undefined)).finally(() => {
                    pending--
                    if (closing && pending === 0) {
                        originalClose()
                    }
                })
            }
        })
        originalClose = server.close.bind(server)
        const requestClose = () => {
            closing = true
            if (pending === 0) {
                originalClose()
            }
        }
        server.close = requestClose
        const exit = server.commands.exit
        if (!exit) {
            throw new Error('The Node.js REPL is missing the .exit command.')
        }
        exit.action = function () {
            requestClose()
        }
        server.on('exit', () => {
            output.write(`Detached from "${name}" (still running)\n`)
            resolve()
        })
    })
}
