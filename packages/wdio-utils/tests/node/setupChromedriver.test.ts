import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Browser, BrowserPlatform, type InstalledBrowser } from '@puppeteer/browsers'
import path from 'node:path'

import { setupChromedriver } from '../../src/node/utils.js'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

vi.mock('locate-app', () => ({
    locateChrome: vi.fn().mockRejectedValue(new Error('Chrome not found'))
}))

vi.mock('../../src/node/electronChromedriverProvider.js', () => ({
    ElectronChromedriverProvider: vi.fn().mockImplementation(() => ({
        supports: vi.fn().mockResolvedValue(true),
        getDownloadUrl: vi.fn().mockResolvedValue(new URL('https://example.com/chromedriver.zip')),
        getExecutablePath: vi.fn().mockReturnValue('chromedriver'),
        getName: vi.fn().mockReturnValue('electron')
    }))
}))

vi.mock('@puppeteer/browsers', async () => {
    const actual = await vi.importActual('@puppeteer/browsers')
    return {
        ...actual,
        install: vi.fn(),
        resolveBuildId: vi.fn(),
        detectBrowserPlatform: vi.fn(),
        canDownload: vi.fn()
    }
})

// Import mocked functions after vi.mock() calls
const mockInstall = vi.mocked((await import('@puppeteer/browsers')).install)
const mockResolveBuildId = vi.mocked((await import('@puppeteer/browsers')).resolveBuildId)
const mockDetectBrowserPlatform = vi.mocked((await import('@puppeteer/browsers')).detectBrowserPlatform)
const mockCanDownload = vi.mocked((await import('@puppeteer/browsers')).canDownload)

// A resolved install() result; override buildId/platform per case.
const installedChromedriver = (overrides: Partial<InstalledBrowser> = {}): InstalledBrowser => ({
    executablePath: '/path/to/chromedriver',
    browser: Browser.CHROMEDRIVER,
    buildId: '130.0.6723.58',
    platform: BrowserPlatform.LINUX_ARM,
    path: '/cache/chromedriver',
    ...overrides
})

// _install retries once internally, so the primary attempt is two rejections; the fallback
// then succeeds on its first try — the third install() call the assertions read as calls[2].
const mockInstallFailsThenSucceeds = (message: string, resolved: InstalledBrowser = installedChromedriver()) => {
    mockInstall
        .mockRejectedValueOnce(new Error(message))
        .mockRejectedValueOnce(new Error(message))
        .mockResolvedValueOnce(resolved)
}

describe('setupChromedriver', () => {
    const originalPlatform = process.platform

    beforeEach(() => {
        vi.clearAllMocks()
        // Default to a Linux host (getBuildIdByChromePath branches on the OS); the platform under
        // test is set per case via mockDetectBrowserPlatform. Windows/macOS cases override below.
        Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
        mockInstall.mockResolvedValue(installedChromedriver())
        mockResolveBuildId.mockResolvedValue('130.0.6723.58')
        // Default: the exact build is downloadable from Chrome for Testing.
        mockCanDownload.mockResolvedValue(true)
    })

    afterEach(() => {
        // Restore process.platform (cases mutate it); keep it configurable so a later
        // defineProperty doesn't throw, avoiding suite-ordering flakiness.
        Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true })
    })

    describe('automatic platform-based fallback', () => {
        it('should use Chrome for Testing first on Linux ARM64 without explicit capabilities', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)

            const result = await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            expect(result).toEqual({
                executablePath: '/path/to/chromedriver'
            })

            // Chrome for Testing now serves linux-arm64, so it is the primary source: the first
            // install must target the ARM platform without the Electron provider.
            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.platform).toBe(BrowserPlatform.LINUX_ARM)
            expect(installCall.providers).toBeUndefined()
        })

        it('should fall back to the Electron release when Chrome for Testing fails on Linux ARM64', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)

            // Primary CfT install fails; the Electron fallback then succeeds.
            mockInstallFailsThenSucceeds('CfT arm64 build missing')

            const result = await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            expect(result).toEqual({ executablePath: '/path/to/chromedriver' })
            expect(mockInstall.mock.calls[0][0].providers).toBeUndefined()
            const fallbackCall = mockInstall.mock.calls[2][0]
            expect(fallbackCall.providers).toBeDefined()
            expect(fallbackCall.providers).toHaveLength(1)
        })

        it('falls back to the Electron release when Chrome for Testing build resolution rejects on Linux ARM64', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)
            // Chrome for Testing resolution itself rejects (a CfT outage, or a milestone CfT never
            // served for arm64). This happens before the install() error boundary, so without the
            // resolution-time fallback setup would terminate here instead of trying Electron.
            mockResolveBuildId.mockRejectedValue(new Error('CfT unavailable'))

            const result = await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            expect(result).toEqual({ executablePath: '/path/to/chromedriver' })
            // The requested version is reused directly as the buildId the Electron provider maps.
            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('130.0.6723.58')
            expect(installCall.providers).toBeDefined()
            expect(installCall.providers).toHaveLength(1)
        })

        it('falls back to the Electron release when the Chrome for Testing availability lookup rejects on Linux ARM64', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)
            mockResolveBuildId.mockResolvedValue('130.0.6723.58')
            // canDownload() rejecting (e.g. a transient network error) is also before the
            // install() boundary and must not bypass the Electron fallback.
            mockCanDownload.mockRejectedValue(new Error('network error'))

            const result = await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            expect(result).toEqual({ executablePath: '/path/to/chromedriver' })
            // resolveBuildId succeeded before canDownload rejected, so the resolved build is reused.
            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('130.0.6723.58')
            expect(installCall.providers).toBeDefined()
        })

        it('resolves stable via the Electron release when CfT resolution rejects and no Chrome is installed on Linux ARM64', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)
            // The Chromedriver lookup rejects; with no concrete version to hand the Electron
            // provider, the fallback resolves stable via the always-served LINUX platform.
            mockResolveBuildId
                .mockRejectedValueOnce(new Error('CfT unavailable'))
                .mockResolvedValueOnce('131.0.6778.85')

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome'
            })

            expect(mockResolveBuildId).toHaveBeenCalledWith(
                Browser.CHROME,
                BrowserPlatform.LINUX,
                'stable'
            )
            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('131.0.6778.85')
            expect(installCall.providers).toBeDefined()
        })

        it('does not fall back to the Electron release when CfT resolution rejects on Linux x64', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)
            // x64 is served by Chrome for Testing, so a resolution failure is genuine: it must
            // surface unchanged rather than being masked by an Electron download attempt.
            mockResolveBuildId.mockRejectedValue(new Error('CfT unavailable'))

            await expect(
                setupChromedriver('/cache', '130.0.6723.58', { browserName: 'chrome' })
            ).rejects.toThrow('CfT unavailable')

            expect(mockInstall).not.toHaveBeenCalled()
        })

        it('resolves the Chromedriver build for "stable" on Linux ARM64 when no Chrome is installed', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)
            mockResolveBuildId.mockResolvedValueOnce('131.0.6778.85') // Resolved stable Chromedriver

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome'
            })

            // Chrome for Testing serves linux-arm64, so the standard path resolves the
            // Chromedriver build for the ARM target directly.
            expect(mockResolveBuildId).toHaveBeenCalledWith(
                Browser.CHROMEDRIVER,
                BrowserPlatform.LINUX_ARM,
                'stable'
            )

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('131.0.6778.85')
            expect(installCall.providers).toBeUndefined()
        })

        it('should NOT use fallback on Linux x64', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)

            await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.providers).toBeUndefined()
        })

        it('should NOT use fallback on macOS ARM64', async () => {
            Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.MAC_ARM)

            await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.providers).toBeUndefined()
        })

        it('uses the standard Chrome for Testing (x64) driver on Windows ARM64 without explicit capabilities', async () => {
            // detectBrowserPlatform() reports WIN64 on Windows ARM64, and the win64 (x64)
            // Chromedriver runs under Windows' transparent x64 emulation and drives native ARM64
            // Chrome over CDP — so there's nothing to force to the Electron provider.
            Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.WIN64)

            await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.platform).toBe(BrowserPlatform.WIN64)
            expect(installCall.providers).toBeUndefined()
        })

        it('should NOT use fallback on Windows x64', async () => {
            Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.WIN64)

            await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.providers).toBeUndefined()
        })
    })

    describe('explicit Electron capabilities (backward compatibility)', () => {
        it('should use Electron provider with wdio:electronVersion', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome',
                'wdio:electronVersion': '33.2.1'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('33.2.1')
            expect(installCall.providers).toBeDefined()
            expect(installCall.providers).toHaveLength(1)
        })

        it('should prefer wdio:electronVersion over automatic fallback', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome',
                'wdio:electronVersion': '33.2.1'
            })

            expect(mockResolveBuildId).not.toHaveBeenCalled()

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('33.2.1')
        })
    })

    describe('version detection priority', () => {
        it('should use driverVersion parameter if provided', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)
            mockResolveBuildId.mockResolvedValueOnce('129.0.6668.70')

            await setupChromedriver('/cache', '129.0.6668.70', {
                browserName: 'chrome'
            })

            expect(mockResolveBuildId).toHaveBeenCalledWith(
                Browser.CHROMEDRIVER,
                BrowserPlatform.LINUX_ARM,
                '129.0.6668.70'
            )
            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('129.0.6668.70')

            // Should not probe Chrome for Testing for a "stable" Chrome version
            expect(mockResolveBuildId).not.toHaveBeenCalledWith(
                Browser.CHROME,
                expect.anything(),
                'stable'
            )
        })

        it('should detect Chrome version if installed', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)

            // Routes getBuildIdByChromePath down the Unix code path
            const os = await import('node:os')
            vi.spyOn(os.default, 'platform').mockReturnValue('linux')

            const { locateChrome } = await import('locate-app')
            vi.mocked(locateChrome).mockResolvedValue('/usr/bin/google-chrome')

            const childProcess = await import('node:child_process')
            vi.spyOn(childProcess.default, 'spawnSync').mockReturnValue({
                pid: 123,
                output: [],
                stdout: 'Google Chrome 130.0.6723.116\n',
                stderr: '',
                status: 0,
                signal: null
            })
            mockResolveBuildId.mockResolvedValueOnce('130.0.6723.116')

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('130.0.6723.116')
        })
    })

    describe('standard path (no Electron provider)', () => {
        it('falls back to a known-good major build when the exact Chromedriver is not downloadable', async () => {
            // macOS x64 → standard Chrome-for-Testing path (no alternative provider).
            Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.MAC)
            mockCanDownload.mockResolvedValue(false) // exact build not on CfT
            mockResolveBuildId
                .mockResolvedValueOnce('130.0.6723.99') // exact resolve for requested version
                .mockResolvedValueOnce('130.0.6723.0')  // known-good build for the major

            await setupChromedriver('/cache', '130.0.6723.99', { browserName: 'chrome' })

            expect(mockCanDownload).toHaveBeenCalled()
            expect(mockResolveBuildId).toHaveBeenLastCalledWith(
                Browser.CHROMEDRIVER,
                BrowserPlatform.MAC,
                '130'
            )
            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('130.0.6723.0')
            // Standard path never uses the Electron provider
            expect(installCall.providers).toBeUndefined()
        })

        it('throws a clear error when no known-good major build can be resolved', async () => {
            Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.MAC)
            mockCanDownload.mockResolvedValue(false)
            mockResolveBuildId
                .mockResolvedValueOnce('130.0.6723.99') // exact
                .mockResolvedValueOnce(undefined as never) // no known-good build

            await expect(
                setupChromedriver('/cache', '130.0.6723.99', { browserName: 'chrome' })
            ).rejects.toThrow(/known good Chromedriver/)
        })
    })

    describe('W3C capabilities format', () => {
        it('should parse wdio:electronVersion from alwaysMatch', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome',
                alwaysMatch: {
                    'wdio:electronVersion': '33.2.1'
                }
            } as any)

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('33.2.1')
            expect(installCall.providers).toBeDefined()
        })
    })
})
