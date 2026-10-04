import { SessionError } from '../errors.js'
import type { ActionFn } from '../session.js'
import { openDialog } from './contexts.js'

export const info: ActionFn = async (s) => {
    const caps = s.browser.capabilities as Record<string, unknown>
    const data: Record<string, unknown> = {
        name: s.name,
        sessionId: s.browser.sessionId,
        target: s.plan.target,
        label: s.plan.label,
        platform: s.platform,
        browserName: caps.browserName,
        browserVersion: caps.browserVersion,
        platformName: caps.platformName,
        bidi: s.isBidi,
        artifactsDir: s.artifactsDir,
        headless: s.plan.headless
    }
    const dialog = openDialog(s)
    if (dialog) {
        data.dialog = `${dialog.type} ${JSON.stringify(dialog.message)}`
    } else if (s.isWeb && !s.applies.includes('M')) {
        data.url = await s.currentUrl()
        data.title = await s.browser.getTitle().catch(() => undefined)
        data.windowSize = await s.browser.getWindowSize().catch(() => undefined)
        data.frame = s.get<string>('frame') || 'top'
    }
    if (s.applies.includes('M')) {
        data.context = await s.browser.getContext().catch(() => undefined)
        if (String(caps.platformName).toLowerCase() === 'android') {
            data.activity = await s.browser.getCurrentActivity().catch(() => undefined)
            data.package = await s.browser.getCurrentPackage().catch(() => undefined)
        }
        data.windowSize = await s.browser.getWindowSize().catch(() => undefined)
    }
    if (s.plan.configPath) {
        data.config = s.plan.configPath
        data.capabilities = s.plan.capabilities
    }
    const text = Object.entries(data)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k.padEnd(16)}${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join('\n')
    return { text, data }
}

export const close: ActionFn = async (s) => {
    if (s.onResume) {
        s.set('closedFromSession', true)
        s.onResume()
        return { text: `Closed "${s.name}" (test failed: Session closed from wdio session)` }
    }
    setTimeout(() => s.onShutdown?.('close'), 20)
    return { text: `Closed "${s.name}"` }
}

export const resume: ActionFn = async (s) => {
    if (!s.onResume) {
        throw new SessionError('NOT_SUPPORTED', '`resume` only works for sessions paused by `wdio run --debug=agent`.')
    }
    s.onResume()
    return { text: `Resumed "${s.name}"` }
}
