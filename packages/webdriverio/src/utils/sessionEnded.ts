/**
 * A leaf module: the session managers and the network interception import it, and must
 * not import the `utils/index.ts` barrel. `webdriver` owns the session end errors and the
 * state of the WebDriver BiDi connection.
 */
import { isSessionEndedError, isBidiConnectionClosed } from 'webdriver'

interface ListenerLog {
    debug (...args: unknown[]): void
    warn (...args: unknown[]): void
}

/**
 * Log the error of a command that an event listener or a background task sent: it has
 * no caller to give the error to. At the end of a session (a session end error, or any
 * error after the WebDriver BiDi connection of `browser` closed) it is a debug message,
 * any other error is a warning.
 */
export function logBackgroundError (log: ListenerLog, message: string, err: unknown, browser?: unknown) {
    const reason = err instanceof Error ? err.message : String(err)
    if (isSessionEndedError(err) || isBidiConnectionClosed(browser)) {
        log.debug(`${message}, the session ended: ${reason}`)
        return
    }
    log.warn(`${message}: ${reason}`)
}
