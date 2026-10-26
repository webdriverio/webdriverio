import { getBrowserNames } from '@wdio/reporter'

type SessionInfo = { browserNames?: string[], capabilities?: unknown, isMultiRemote?: boolean } | undefined

/**
 * The browser of the report header: the `browserName` option when it is set, else the
 * browsers of the sessions (each name one time), else `fallback`. A worker file keeps the
 * names that the worker found: its capabilities are a reduced copy.
 */
export function headerBrowserName (configured: string | undefined, sessions: SessionInfo[], fallback: string) {
    if (configured !== undefined) {
        return configured
    }
    const names = new Set(sessions.flatMap((info) => Array.isArray(info?.browserNames) ? info.browserNames : getBrowserNames(info?.capabilities, info?.isMultiRemote)))
    return [...names].join(', ') || fallback
}
