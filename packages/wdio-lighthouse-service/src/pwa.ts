import logger from '@wdio/logger'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/api/CDPSession.js'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'

import { PWA_AUDIT_NAMES } from './constants.js'
import type { AuditResult, LHAuditResult, PWAAudits } from './types.js'

const log = logger('@wdio/lighthouse-service:PWA')

interface ManifestIcon {
    src?: string
    sizes?: string
    purpose?: string
    type?: string
}

interface WebAppManifest {
    name?: string
    short_name?: string
    start_url?: string
    display?: string
    background_color?: string
    theme_color?: string
    icons?: ManifestIcon[]
    prefer_related_applications?: boolean
}

interface PWAPageState {
    url: string
    manifestHref?: string
    manifest?: WebAppManifest | null
    manifestParseError?: string
    viewportContent?: string
    appleTouchIconHref?: string
    themeColor?: string
    innerWidth: number
    documentWidth: number
    hasServiceWorker: boolean
}

interface InstallabilityError {
    errorId?: string
    errorArguments?: Array<{ name?: string, value?: string }>
}

function passed (displayValue: string, explanation?: string): LHAuditResult {
    return { score: 1, displayValue, explanation }
}

function failed (displayValue: string, explanation: string): LHAuditResult {
    return { score: 0, displayValue, explanation }
}

function parseIconSize (sizes?: string): number {
    if (!sizes || sizes === 'any') {
        return sizes === 'any' ? Number.POSITIVE_INFINITY : 0
    }

    return sizes.split(/\s+/).reduce((max, entry) => {
        const match = entry.match(/^(\d+)x(\d+)$/i)
        if (!match) {
            return max
        }
        return Math.max(max, Math.min(Number(match[1]), Number(match[2])))
    }, 0)
}

function hasIconOfSize (icons: ManifestIcon[] = [], minSize: number): boolean {
    return icons.some((icon) => parseIconSize(icon.sizes) >= minSize)
}

async function collectPageState (page: Page): Promise<PWAPageState> {
    return page.evaluate(async () => {
        const manifestLink = document.querySelector('link[rel~="manifest"]') as HTMLLinkElement | null
        const viewport = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null
        const appleTouch = document.querySelector('link[rel~="apple-touch-icon"]') as HTMLLinkElement | null
        const themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null

        let manifest: WebAppManifest | null = null
        let manifestParseError: string | undefined
        const manifestHref = manifestLink?.href

        if (manifestHref) {
            try {
                const response = await fetch(manifestHref, { credentials: 'same-origin' })
                if (!response.ok) {
                    manifestParseError = `Failed to fetch manifest: HTTP ${response.status}`
                } else {
                    manifest = await response.json() as WebAppManifest
                }
            } catch (error) {
                manifestParseError = error instanceof Error ? error.message : String(error)
            }
        }

        let hasServiceWorker = false
        try {
            const registration = await navigator.serviceWorker?.getRegistration()
            hasServiceWorker = Boolean(registration)
        } catch {
            hasServiceWorker = false
        }

        return {
            url: location.href,
            manifestHref,
            manifest,
            manifestParseError,
            viewportContent: viewport?.content,
            appleTouchIconHref: appleTouch?.href,
            themeColor: themeColor?.content,
            innerWidth: window.innerWidth,
            documentWidth: document.documentElement.clientWidth,
            hasServiceWorker
        }
    })
}

async function getInstallabilityErrors (session: CDPSession): Promise<InstallabilityError[]> {
    try {
        const result = await session.send('Page.getInstallabilityErrors') as {
            errors?: InstallabilityError[]
            installabilityErrors?: InstallabilityError[]
        }
        return result.installabilityErrors ?? result.errors ?? []
    } catch (error) {
        log.debug(`Page.getInstallabilityErrors is unavailable: ${(error as Error).message}`)
        return []
    }
}

export function evaluatePWAChecks (state: PWAPageState, installabilityErrors: InstallabilityError[]): Record<PWAAudits, LHAuditResult> {
    const manifest = state.manifest
    const icons = manifest?.icons ?? []
    const display = manifest?.display
    const hasName = Boolean(manifest?.name || manifest?.short_name)
    const hasStartUrl = Boolean(manifest?.start_url)
    const hasValidDisplay = ['fullscreen', 'standalone', 'minimal-ui'].includes(String(display))
    const preferRelatedApps = manifest?.prefer_related_applications === true
    const installableByManifest = Boolean(
        state.manifestHref &&
        manifest &&
        hasName &&
        hasStartUrl &&
        hasValidDisplay &&
        !preferRelatedApps &&
        hasIconOfSize(icons, 192)
    )
    const blockingInstallErrors = installabilityErrors.filter((error) => error.errorId && error.errorId !== 'already-installed')

    const isInstallable = blockingInstallErrors.length === 0 && installableByManifest
        ? passed('installable-manifest', 'Web app manifest meets installability requirements')
        : failed(
            'installable-manifest',
            blockingInstallErrors.length
                ? `Installability errors: ${blockingInstallErrors.map((error) => error.errorId).join(', ')}`
                : state.manifestParseError || 'Web app manifest does not meet installability requirements'
        )

    const serviceWorker = state.hasServiceWorker
        ? passed('service-worker', 'A service worker controls this page')
        : failed('service-worker', 'No service worker registration was found for this page')

    const splashScreen = manifest && hasName && manifest.background_color && hasIconOfSize(icons, 512)
        ? passed('splash-screen', 'Manifest provides a custom splash screen')
        : failed('splash-screen', 'Manifest is missing name, background_color, or a 512px icon')

    const themedOmnibox = state.themeColor || manifest?.theme_color
        ? passed('themed-omnibox', 'A theme color is provided via manifest or meta tag')
        : failed('themed-omnibox', 'No theme-color meta tag or manifest.theme_color was found')

    const hasViewport = Boolean(state.viewportContent && /width=|initial-scale=/i.test(state.viewportContent))
    const viewport = hasViewport
        ? passed('viewport', 'A viewport meta tag is configured')
        : failed('viewport', 'No usable viewport meta tag was found')

    const contentFits = !hasViewport || Math.abs(state.innerWidth - state.documentWidth) <= 1
    const contentWith = contentFits
        ? passed('content-width', 'Content size matches the viewport')
        : failed('content-width', `Content width (${state.documentWidth}) does not match viewport width (${state.innerWidth})`)

    const appleTouchIcon = state.appleTouchIconHref
        ? passed('apple-touch-icon', 'An Apple touch icon is present')
        : failed('apple-touch-icon', 'No apple-touch-icon link was found')

    const maskableIcon = icons.some((icon) => String(icon.purpose || '').split(/\s+/).includes('maskable'))
        ? passed('maskable-icon', 'Manifest includes a maskable icon')
        : failed('maskable-icon', 'Manifest does not include a maskable icon')

    return {
        isInstallable,
        serviceWorker,
        splashScreen,
        themedOmnibox,
        contentWith,
        viewport,
        appleTouchIcon,
        maskableIcon
    }
}

export default class PWAAuditor {
    constructor (
        private _session: CDPSession,
        private _page: Page
    ) {}

    async audit (auditsToBeRun: PWAAudits[] = [...PWA_AUDIT_NAMES]): Promise<AuditResult> {
        const [state, installabilityErrors] = await Promise.all([
            collectPageState(this._page),
            getInstallabilityErrors(this._session)
        ])
        const allDetails = evaluatePWAChecks(state, installabilityErrors)
        const details = Object.fromEntries(
            Object.entries(allDetails).filter(([name]) => auditsToBeRun.includes(name as PWAAudits))
        ) as Record<string, LHAuditResult>

        return {
            passed: !Object.values(details).some((result) => result.score < 1),
            details
        }
    }
}
