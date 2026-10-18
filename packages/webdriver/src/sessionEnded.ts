import { SESSION_ENDED_ERROR } from './constants.js'

/**
 * `true` for the error of a command that can get no result because its session or its
 * WebDriver BiDi connection ended: a WebDriver BiDi command in flight or sent when the
 * connection closed, a command after `deleteSession`, or the `invalid session id` error
 * of a driver. Code that sends a command in the background (e.g. an event listener) can
 * ignore it at the end of a session.
 */
export function isSessionEndedError (err: unknown) {
    const name = err instanceof Error ? err.name : undefined
    return name === SESSION_ENDED_ERROR || name === 'invalid session id'
}

/**
 * `true` when the WebDriver BiDi connection of a client was open and is closed now, e.g.
 * after `deleteSession`. Then any command of the session can fail, also with a transport
 * error (a WebDriver Classic request to a driver that `deleteSession` stopped). A client
 * whose WebDriver BiDi connection could not be made, or without one, gives `false`.
 */
export function isBidiConnectionClosed (client: unknown) {
    return (client as { _bidiHandler?: { isClosed?: boolean } } | undefined)?._bidiHandler?.isClosed === true
}
