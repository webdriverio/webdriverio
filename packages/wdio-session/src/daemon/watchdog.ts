import logger from '@wdio/logger'

import { WATCHDOG_INTERVAL } from '../constants.js'
import { isDeadSessionError, type Session } from '../session.js'
import { isPidAlive } from './state.js'
import type { Launched } from '../targets/launch.js'
import type { SessionServer } from './server.js'

const log = logger('@wdio/session:watchdog')

/**
 * failed pings in a row before the session counts as gone: one can fail
 * while the browser is busy (a page that hogs the renderer, a bot check
 * reloading itself)
 */
const PINGS_TO_FAIL = 2

/**
 * Shut the daemon down when the browser, app or driver goes away. A process
 * that exited or a closed BiDi connection ends it right away, a failed ping
 * only when the next one fails too.
 */
export function startWatchdog (session: Session, launched: Pick<Launched, 'pids'>, server: Pick<SessionServer, 'busy'>, onDead: () => void, interval = WATCHDOG_INTERVAL) {
    let dead = false
    const die = (reason: string) => {
        if (dead) {
            return
        }
        dead = true
        log.warn(`Session is gone: ${reason}`)
        clearInterval(timer)
        onDead()
    }

    const socket = (session.browser as unknown as { _bidiHandler?: { socket?: { on?: (ev: string, fn: () => void) => void } } })._bidiHandler?.socket
    socket?.on?.('close', () => die('BiDi connection closed'))

    let pinging = false
    let failed = 0
    const timer = setInterval(async () => {
        for (const pid of launched.pids()) {
            if (!isPidAlive(pid)) {
                return die(`process ${pid} exited`)
            }
        }
        if (pinging || server.busy) {
            return
        }
        pinging = true
        try {
            await (session.applies.includes('W') && !session.applies.includes('M')
                ? session.browser.getWindowHandles()
                : session.browser.getTimeouts())
            failed = 0
        } catch (err) {
            if (isDeadSessionError(err) && ++failed >= PINGS_TO_FAIL) {
                die((err as Error).message)
            } else if (isDeadSessionError(err)) {
                log.warn(`Ping failed, checking again: ${(err as Error).message}`)
            }
        } finally {
            pinging = false
        }
    }, interval)
    timer.unref()
    session.disposers.push(() => clearInterval(timer))
    return () => clearInterval(timer)
}
