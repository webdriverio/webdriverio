/**
 * A leaf module (no import from this package): the session managers and the
 * network interception import it, and must not import the `utils/index.ts` barrel.
 */

/**
 * The messages of a command that can get no result because the session or its
 * WebDriver BiDi connection ended.
 */
const SESSION_ENDED_MESSAGES = [
    /**
     * `webdriver`: a WebDriver BiDi command in flight when the connection closes
     */
    'got no result: the connection was closed',
    'got no result: the browser or the driver closed the connection',
    /**
     * `webdriver`: a WebDriver BiDi command sent after the connection closed
     */
    'No connection to WebDriver Bidi was established',
    /**
     * `webdriver`: a WebDriver Classic command sent after `deleteSession`
     */
    'after session has been deleted',
    /**
     * a WebDriver Classic command of a session that the driver no longer has
     */
    'invalid session id'
]

/**
 * `true` for the error of a command that ran when the session or its WebDriver BiDi
 * connection ended, for example when an event listener still waits for a command
 * while the session is deleted.
 */
export function isSessionEndedError (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return SESSION_ENDED_MESSAGES.some((text) => message.includes(text))
}

interface ListenerLog {
    debug (...args: unknown[]): void
    warn (...args: unknown[]): void
}

/**
 * Log the error of a command that an event listener or a background task sent: it has
 * no caller to give the error to. At the end of a session such an error is expected,
 * so it is a debug message; any other error is a warning.
 */
export function logBackgroundError (log: ListenerLog, message: string, err: unknown) {
    const reason = err instanceof Error ? err.message : String(err)
    if (isSessionEndedError(err)) {
        log.debug(`${message}, the session ended: ${reason}`)
        return
    }
    log.warn(`${message}: ${reason}`)
}
