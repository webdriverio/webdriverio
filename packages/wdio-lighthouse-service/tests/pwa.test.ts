import path from 'node:path'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import type { CDPSession } from 'puppeteer-core/lib/esm/puppeteer/api/CDPSession.js'
import type { Page } from 'puppeteer-core/lib/esm/puppeteer/api/Page.js'

import PWAAuditor, { evaluatePWAChecks } from '../src/pwa.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

const passingState = {
    url: 'https://webdriver.io/',
    manifestHref: 'https://webdriver.io/manifest.json',
    manifest: {
        name: 'WebdriverIO',
        short_name: 'WDIO',
        start_url: '/',
        display: 'standalone',
        background_color: '#fff',
        theme_color: '#ea5906',
        icons: [
            { src: '/icon-192.png', sizes: '192x192', purpose: 'any' },
            { src: '/icon-512.png', sizes: '512x512', purpose: 'any maskable' }
        ]
    },
    viewportContent: 'width=device-width, initial-scale=1',
    appleTouchIconHref: 'https://webdriver.io/apple-touch-icon.png',
    themeColor: '#ea5906',
    innerWidth: 390,
    documentWidth: 390,
    hasServiceWorker: true
}

describe('evaluatePWAChecks', () => {
    it('passes a complete PWA', () => {
        const details = evaluatePWAChecks(passingState, [])
        expect(Object.values(details).every((result) => result.score === 1)).toBe(true)
    })

    it('fails when the manifest is missing required installability fields', () => {
        const details = evaluatePWAChecks({
            ...passingState,
            manifest: { name: 'WDIO' }
        }, [])
        expect(details.isInstallable.score).toBe(0)
        expect(details.splashScreen.score).toBe(0)
        expect(details.maskableIcon.score).toBe(0)
    })

    it('uses Chrome installability errors when present', () => {
        const details = evaluatePWAChecks(passingState, [{ errorId: 'no-icon-available' }])
        expect(details.isInstallable.score).toBe(0)
        expect(details.isInstallable.explanation).toContain('no-icon-available')
    })

    it('ignores already-installed installability errors', () => {
        const details = evaluatePWAChecks(passingState, [{ errorId: 'already-installed' }])
        expect(details.isInstallable.score).toBe(1)
    })

    it('fails viewport, content width, apple touch icon and theme color', () => {
        const details = evaluatePWAChecks({
            ...passingState,
            viewportContent: undefined,
            appleTouchIconHref: undefined,
            themeColor: undefined,
            manifest: {
                ...passingState.manifest!,
                theme_color: undefined,
                background_color: undefined,
                icons: [{ src: '/icon.png', sizes: '48x48' }]
            },
            innerWidth: 390,
            documentWidth: 800,
            hasServiceWorker: false
        }, [])

        expect(details.viewport.score).toBe(0)
        expect(details.contentWith.score).toBe(1)
        expect(details.appleTouchIcon.score).toBe(0)
        expect(details.themedOmnibox.score).toBe(0)
        expect(details.serviceWorker.score).toBe(0)
        expect(details.splashScreen.score).toBe(0)
    })

    it('fails content width when a viewport exists but the layout overflows', () => {
        const details = evaluatePWAChecks({
            ...passingState,
            innerWidth: 390,
            documentWidth: 800
        }, [])
        expect(details.contentWith.score).toBe(0)
    })

    it('skips malformed icon sizes and still accepts a valid one', () => {
        const details = evaluatePWAChecks({
            ...passingState,
            manifest: {
                ...passingState.manifest!,
                icons: [
                    { src: '/icon.png', sizes: 'huge 64x', purpose: 'any' },
                    { src: '/icon-512.png', sizes: '512x512', purpose: 'any maskable' }
                ]
            }
        }, [])
        expect(details.isInstallable.score).toBe(1)
        expect(details.splashScreen.score).toBe(1)
    })

    it('fails installability when the manifest prefers related applications', () => {
        const details = evaluatePWAChecks({
            ...passingState,
            manifest: {
                ...passingState.manifest!,
                prefer_related_applications: true
            }
        }, [])
        expect(details.isInstallable.score).toBe(0)
    })

    it('treats any-sized icons as large enough for splash and installability', () => {
        const details = evaluatePWAChecks({
            ...passingState,
            manifest: {
                ...passingState.manifest!,
                icons: [{ src: '/icon.svg', sizes: 'any', purpose: 'any maskable' }]
            }
        }, [])
        expect(details.isInstallable.score).toBe(1)
        expect(details.splashScreen.score).toBe(1)
        expect(details.maskableIcon.score).toBe(1)
    })

    it('reports a manifest fetch error', () => {
        const details = evaluatePWAChecks({
            ...passingState,
            manifest: null,
            manifestParseError: 'Failed to fetch manifest: HTTP 404'
        }, [])
        expect(details.isInstallable.explanation).toContain('Failed to fetch manifest')
    })
})

describe('PWAAuditor', () => {
    const page = {
        evaluate: vi.fn()
    } as unknown as Page
    const session = {
        send: vi.fn()
    } as unknown as CDPSession

    beforeEach(() => {
        vi.mocked(page.evaluate).mockReset()
        vi.mocked(session.send).mockReset()
    })

    it('gathers page state and installability errors', async () => {
        vi.mocked(page.evaluate).mockResolvedValue(passingState)
        vi.mocked(session.send).mockResolvedValue({ installabilityErrors: [] })

        const auditor = new PWAAuditor(session, page)
        const result = await auditor.audit()

        expect(session.send).toHaveBeenCalledWith('Page.getInstallabilityErrors')
        expect(result.passed).toBe(true)
        expect(Object.keys(result.details)).toEqual(expect.arrayContaining([
            'isInstallable',
            'serviceWorker',
            'maskableIcon'
        ]))
    })

    it('can filter audits and tolerate a missing CDP method', async () => {
        vi.mocked(page.evaluate).mockResolvedValue({
            ...passingState,
            hasServiceWorker: false
        })
        vi.mocked(session.send).mockRejectedValue(new Error('Not allowed'))

        const auditor = new PWAAuditor(session, page)
        const result = await auditor.audit(['serviceWorker', 'viewport'])

        expect(result.passed).toBe(false)
        expect(Object.keys(result.details)).toEqual(['serviceWorker', 'viewport'])
        expect(result.details.serviceWorker.score).toBe(0)
        expect(result.details.viewport.score).toBe(1)
    })

    it('reads installability errors from the legacy errors field', async () => {
        vi.mocked(page.evaluate).mockResolvedValue(passingState)
        vi.mocked(session.send).mockResolvedValue({ errors: [{ errorId: 'no-manifest' }] })

        const auditor = new PWAAuditor(session, page)
        const result = await auditor.audit(['isInstallable'])

        expect(result.details.isInstallable.score).toBe(0)
    })
})
