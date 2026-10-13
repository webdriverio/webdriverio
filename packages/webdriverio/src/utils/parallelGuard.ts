import { getParallelContextStore } from '../session/context.js'

/**
 * Commands that act on the whole browser or OS window cannot be scoped to one
 * parallel test's browsing context, so they must not run silently against another one.
 */
export function assertNotInParallelScope (command: string, reason: string) {
    if (getParallelContextStore().getStore()) {
        throw new Error(`"${command}" is not supported inside parallel mode tests because ${reason}`)
    }
}
