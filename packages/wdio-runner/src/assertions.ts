import { stripVTControlCharacters } from 'node:util'
import { registerUserCommands, runUserCommand } from '@wdio/utils'

type Matcher = (this: { isNot?: boolean } | undefined, ...args: unknown[]) => unknown

// a matcher that is already a user command
const ASSERTION_WRAPPER = Symbol('wdio.assertionWrapper')

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
        if (typeof matcher !== 'function' || ASSERTION_WRAPPER in matcher) {
            continue
        }
        registerUserCommands([`expect.${name}`, `expect.not.${name}`])
        wrapped[name] = Object.assign(function (this: { isNot?: boolean } | undefined, ...args: unknown[]) {
            const isNot = Boolean(this?.isNot)
            return runUserCommand(
                getBrowser(),
                `expect.${isNot ? 'not.' : ''}${name}`,
                args,
                () => (matcher as Matcher).apply(this, args) as Promise<unknown>,
                (result) => assertionResult(result, isNot)
            )
        }, { [ASSERTION_WRAPPER]: true })
    }
    if (Object.keys(wrapped).length > 0) {
        expectLib.extend(wrapped)
    }
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
