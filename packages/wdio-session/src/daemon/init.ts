import logger from '@wdio/logger'

import type { Session } from '../session.js'

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

    const { startEventCapture } = await import('./capture.js')
    await startEventCapture(session).catch((err) => log.warn(`Event capture unavailable: ${err.message}`))

    const { trackDialogs } = await import('../actions/contexts.js')
    await trackDialogs(session).catch((err) => log.warn(`Dialog tracking unavailable: ${err.message}`))

    const { loadHelpers } = await import('../helpers.js')
    await loadHelpers(session, { watch: true }).catch((err) => log.warn(`Helpers failed to load: ${err.message}`))

    if (plan.keepHistory) {
        session.history.append({ kind: 'marker', code: '// restart' })
    }
    if (plan.url) {
        await session.browser.url(plan.url)
        session.history.append({ kind: 'open', code: `await browser.url(${quote(plan.url)})`, path: await session.currentPath() })
    }
}

export function quote (value: string) {
    return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`
}
