import { stripVTControlCharacters } from 'node:util'
import { registerUserCommands, runUserCommand, getBrowserObject, getWdioKind, WDIO_QUERY, type WdioQuery } from '@wdio/utils'

type Matcher = (this: { isNot?: boolean } | undefined, ...args: unknown[]) => unknown

// a matcher that is already a user command
const ASSERTION_WRAPPER = Symbol('wdio.assertionWrapper')
// Vitest finds an inline snapshot in the test file from the frames of its call: a wrapper frame moves it
const UNWRAPPED_MATCHERS = ['toMatchInlineSnapshot']
// the subjects that belong to a session; a mock has none
const SESSION_KINDS = ['browser', 'element', 'element-array', 'browsing-context']
const MAX_QUERY_STEPS = 10
// the brand of the `some()` wrapper of expect-webdriverio, through the global symbol registry as in expect-webdriverio
const SOME_SYMBOL = Symbol.for('expect-webdriverio.some')

/**
 * Make each call of the matchers one user command (`expect.toHaveText`, `expect.not.toHaveText`), so the
 * commands of its polls are nested. A matcher that a user adds later with `expect.extend` is not changed.
 */
export function wrapAssertions (
    expectLib: { extend: (matchers: Record<string, Matcher>) => void },
    matchers: Record<string, unknown>,
    getBrowser: () => unknown
) {
    const wrapped: Record<string, Matcher> = {}
    for (const [name, matcher] of Object.entries(matchers)) {
        if (typeof matcher !== 'function' || ASSERTION_WRAPPER in matcher || UNWRAPPED_MATCHERS.includes(name)) {
            continue
        }
        registerUserCommands([`expect.${name}`, `expect.not.${name}`])
        wrapped[name] = Object.assign(function (this: { isNot?: boolean } | undefined, ...args: unknown[]) {
            const isNot = Boolean(this?.isNot)
            // the matcher checks the elements of a `some()`; the reporters write it as in the test code
            const some = isSome(args[0])
            const subject = some ? (args[0] as { elements: unknown }).elements : args[0]
            return runUserCommand(
                sessionOf(subject) ?? getBrowser(),
                `expect.${isNot ? 'not.' : ''}${name}`,
                some ? [{ wdio: 'some', elements: subject }, ...args.slice(1)] : args,
                () => (matcher as Matcher).apply(this, args) as Promise<unknown>,
                (result) => assertionResult(result, isNot)
            )
        }, { [ASSERTION_WRAPPER]: true })
    }
    if (Object.keys(wrapped).length > 0) {
        expectLib.extend(wrapped)
    }
}

function isSome (value: unknown) {
    return Boolean(value) && typeof value === 'object' && (value as { [SOME_SYMBOL]?: unknown })[SOME_SYMBOL] === true
}

// the session of the subject, so an assertion on a multi-remote instance is a user command of that instance
function sessionOf (subject: unknown) {
    let current = subject
    // a pending element: its caller (a browser, an element or the previous link of the chain)
    for (let step = 0; step < MAX_QUERY_STEPS && current && (current as { [WDIO_QUERY]?: WdioQuery })[WDIO_QUERY]; step++) {
        current = (current as { [WDIO_QUERY]: WdioQuery })[WDIO_QUERY].parent
    }
    const kind = getWdioKind(current)
    return kind && SESSION_KINDS.includes(kind) ? getBrowserObject(current as WebdriverIO.Browser) : undefined
}

// the status of the assertion for the event: no value when it passes, the message as the error when it fails
function assertionResult (result: unknown, isNot: boolean) {
    const { pass, message } = (result ?? {}) as { pass?: unknown, message?: unknown }
    if (typeof pass !== 'boolean' || pass !== isNot) {
        return { value: undefined }
    }
    const text = stripVTControlCharacters(String(typeof message === 'function' ? message() : message ?? ''))
    const error = new Error(text)
    // the stack of the runner means nothing to a reader
    error.stack = `Error: ${text}`
    return { error }
}
