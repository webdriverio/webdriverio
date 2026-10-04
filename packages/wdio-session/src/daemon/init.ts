import logger from '@wdio/logger'

import { trackDialogs } from '../actions/contexts.js'
import { installNetworkProbe } from '../actions/wait.js'
import { loadHelpers } from '../helpers.js'
import { quote } from '../quote.js'
import type { Session } from '../session.js'
import { startEventCapture } from './capture.js'
import { installPageRecorder } from '../snapshot/recorder.js'
import { untilLoaded, waitForLoad } from '../actions/interact.js'
import { matchHeadedUserAgent } from './userAgent.js'

const log = logger('@wdio/session:init')

export async function applyViewport (session: Session, viewport = session.plan.viewport) {
    if (!viewport || !session.isWeb || session.platform !== 'browser') {
        return
    }
    await (session.isBidi
        ? session.browser.setViewport(viewport)
        : session.browser.setWindowSize(viewport.width, viewport.height))
}

/**
 * Prepare a freshly created session: viewport, event capture, helpers and
 * the initial URL.
 */
export async function initSession (session: Session) {
    const { plan } = session
    try {
        await applyViewport(session)
    } catch (err) {
        log.warn(`Could not set viewport: ${(err as Error).message}`)
    }

    await startEventCapture(session).catch((err) => log.warn(`Event capture unavailable: ${err.message}`))
    await installNetworkProbe(session).catch((err) => log.warn(`Network probe unavailable: ${(err as Error).message}`))
    await installPageRecorder(session).catch((err) => log.warn(`Page recorder unavailable: ${(err as Error).message}`))
    await trackDialogs(session).catch((err) => log.warn(`Dialog tracking unavailable: ${err.message}`))
    await loadHelpers(session, { watch: true }).catch((err) => log.warn(`Helpers failed to load: ${err.message}`))
    await matchHeadedUserAgent(session).catch((err) => log.warn(`Could not set the user agent: ${(err as Error).message}`))

    if (plan.keepHistory) {
        session.history.append({ kind: 'marker', code: '// restart' })
    }
    if (plan.url) {
        // the first page gets the same load limit as every later navigation
        await session.limitPageLoad()
        if (!await untilLoaded(session.browser.url(plan.url))) {
            await waitForLoad(session)
        }
        session.history.append({ kind: 'open', code: `await browser.url(${quote(plan.url)})`, path: await session.currentPath() })
    }
}
