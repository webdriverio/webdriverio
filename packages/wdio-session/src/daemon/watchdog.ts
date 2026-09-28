import logger from '@wdio/logger'

import { WATCHDOG_INTERVAL } from '../constants.js'
import { isDeadSessionError, type Session } from '../session.js'
import { isPidAlive } from './state.js'
import type { Launched } from '../targets/launch.js'
import type { SessionServer } from './server.js'

const log = logger('@wdio/session:watchdog')

/**
 * Shut the daemon down when the browser, app or driver goes away.
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
        } catch (err) {
            if (isDeadSessionError(err)) {
                die((err as Error).message)
            }
        } finally {
            pinging = false
        }
    }, interval)
    timer.unref()
    session.disposers.push(() => clearInterval(timer))
    return () => clearInterval(timer)
}
