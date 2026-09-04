import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Browser, BrowserPlatform } from '@puppeteer/browsers'
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

describe('setupChromedriver', () => {
    const originalArch = process.arch
    const originalPlatform = process.platform

    beforeEach(() => {
        vi.clearAllMocks()
        // Default to a Linux host so the ARM64 cases exercise the linux-arm64 path regardless
        // of the CI runner OS. Without this, a Windows runner's native process.platform==='win32'
        // combined with a test's arch==='arm64' trips isWindowsArm64 and routes to the Electron
        // provider. The Windows/macOS cases override process.platform explicitly below.
        Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })
        mockInstall.mockResolvedValue({
            executablePath: '/path/to/chromedriver',
            browser: Browser.CHROMEDRIVER,
            buildId: '130.0.6723.58',
            platform: BrowserPlatform.LINUX_ARM,
            path: '/cache/chromedriver'
        })
        mockResolveBuildId.mockResolvedValue('130.0.6723.58')
        // Default: the exact build is downloadable from Chrome for Testing.
        mockCanDownload.mockResolvedValue(true)
    })

    afterEach(() => {
        // Restore both arch and platform (tests mutate each), and keep them
        // configurable so a later test's defineProperty doesn't throw — otherwise
        // suite-ordering flakiness creeps in as cases are added.
        Object.defineProperty(process, 'arch', { value: originalArch, configurable: true })
        Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true })
    })

    describe('automatic platform-based fallback', () => {
        it('should use Chrome for Testing first on Linux ARM64 without explicit capabilities', async () => {
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)

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
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)

            // Primary CfT install fails (_install retries once → two rejections); the Electron
            // fallback then succeeds on its first attempt (the third install call).
            mockInstall
                .mockRejectedValueOnce(new Error('CfT arm64 build missing'))
                .mockRejectedValueOnce(new Error('CfT arm64 build missing'))
                .mockResolvedValueOnce({
                    executablePath: '/path/to/chromedriver',
                    browser: Browser.CHROMEDRIVER,
                    buildId: '130.0.6723.58',
                    platform: BrowserPlatform.LINUX_ARM,
                    path: '/cache/chromedriver'
                })

            const result = await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            expect(result).toEqual({ executablePath: '/path/to/chromedriver' })
            expect(mockInstall.mock.calls[0][0].providers).toBeUndefined()
            const fallbackCall = mockInstall.mock.calls[2][0]
            expect(fallbackCall.providers).toBeDefined()
            expect(fallbackCall.providers).toHaveLength(1)
        })

        it('resolves the Chromedriver build for "stable" on Linux ARM64 when no Chrome is installed', async () => {
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)
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
            Object.defineProperty(process, 'arch', { value: 'x64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)

            await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.providers).toBeUndefined()
        })

        it('should NOT use fallback on macOS ARM64', async () => {
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.MAC_ARM)

            await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.providers).toBeUndefined()
        })

        it('should use Electron provider on Windows ARM64 without explicit capabilities', async () => {
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.WIN64)
            mockResolveBuildId.mockResolvedValueOnce('130.0.6723.58')

            const result = await setupChromedriver('/cache', undefined, {
                browserName: 'chrome'
            })

            expect(result).toEqual({
                executablePath: '/path/to/chromedriver'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.providers).toBeDefined()
            expect(installCall.providers).toHaveLength(1)
        })

        it('should NOT use fallback on Windows x64', async () => {
            Object.defineProperty(process, 'arch', { value: 'x64', configurable: true })
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

        it('should use Electron provider with wdio:chromiumVersion', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome',
                'wdio:chromiumVersion': '130.0.6723.2'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('130.0.6723.2')
            expect(installCall.providers).toBeDefined()
        })

        it('should prefer wdio:electronVersion over automatic fallback', async () => {
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)

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
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)
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
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)

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

    describe('error handling', () => {
        it('should fall back to a Chrome-for-Testing build when the Electron download fails on a supported platform', async () => {
            // macOS is served by Chrome for Testing, so the catch-block fallback applies.
            // process.platform must be non-win32 here or isWindowsArm64 could flip the
            // platform into the "needs alternative provider" bucket (state leaks between tests).
            Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.MAC)
            mockResolveBuildId.mockResolvedValue('130.0.0.0') // Fallback resolves to a different build

            // _install retries once internally, so the primary attempt is two rejections;
            // the fallback attempt then succeeds on its first try.
            mockInstall
                .mockRejectedValueOnce(new Error('Download failed'))
                .mockRejectedValueOnce(new Error('Download failed'))
                .mockResolvedValueOnce({
                    executablePath: '/path/to/chromedriver',
                    browser: Browser.CHROMEDRIVER,
                    buildId: '130.0.0.0',
                    platform: BrowserPlatform.MAC,
                    path: '/cache/chromedriver'
                })

            const result = await setupChromedriver('/cache', undefined, {
                browserName: 'chrome',
                'wdio:chromiumVersion': '130.0.6723.58'
            })

            expect(result).toEqual({ executablePath: '/path/to/chromedriver' })
            expect(mockResolveBuildId).toHaveBeenCalledWith(
                Browser.CHROMEDRIVER,
                BrowserPlatform.MAC,
                expect.anything()
            )
            // The fallback build was resolved against CfT, so it must download directly
            // from CfT (no Electron provider). _install retries once, so the fallback
            // attempt is the third install call.
            const fallbackInstallCall = mockInstall.mock.calls[2][0]
            expect(fallbackInstallCall.providers).toBeUndefined()
        })

        it('should throw a combined error if both the Electron download and the fallback fail on a supported platform', async () => {
            Object.defineProperty(process, 'platform', { value: 'darwin', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.MAC)
            mockResolveBuildId.mockResolvedValue('130.0.0.0')

            mockInstall.mockRejectedValue(new Error('Download failed'))

            await expect(
                setupChromedriver('/cache', undefined, {
                    browserName: 'chrome',
                    'wdio:chromiumVersion': '130.0.6723.58'
                })
            ).rejects.toThrow(/Couldn't download Chromedriver/)
        })

        it('should fall back to Chrome for Testing on Linux ARM64 when the Electron download fails', async () => {
            // CfT now serves linux-arm64, so a failed Electron download for an Electron/Chromium
            // capability falls back to a Chrome-for-Testing build rather than surfacing the error.
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)
            mockResolveBuildId.mockResolvedValue('130.0.0.0') // CfT fallback build for the major

            // Electron-primary attempt fails (_install retries once → two rejections); the
            // Chrome-for-Testing fallback then succeeds on its first try (the third call).
            mockInstall
                .mockRejectedValueOnce(new Error('Electron release missing'))
                .mockRejectedValueOnce(new Error('Electron release missing'))
                .mockResolvedValueOnce({
                    executablePath: '/path/to/chromedriver',
                    browser: Browser.CHROMEDRIVER,
                    buildId: '130.0.0.0',
                    platform: BrowserPlatform.LINUX_ARM,
                    path: '/cache/chromedriver'
                })

            const result = await setupChromedriver('/cache', undefined, {
                browserName: 'chrome',
                'wdio:chromiumVersion': '130.0.6723.58'
            })

            expect(result).toEqual({ executablePath: '/path/to/chromedriver' })
            const fallbackCall = mockInstall.mock.calls[2][0]
            expect(fallbackCall.providers).toBeUndefined()
        })

        it('should re-throw the original error on Windows ARM64, which Chrome for Testing does not serve', async () => {
            // Windows ARM64 has no CfT Chromedriver, so there is no fallback to attempt: the
            // original Electron download error must surface unchanged rather than being replaced
            // by a confusing Chrome-for-Testing API error from the fallback path.
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.WIN64)
            mockResolveBuildId.mockResolvedValue('130.0.0.0')
            mockInstall.mockRejectedValue(new Error('Download failed'))

            await expect(
                setupChromedriver('/cache', undefined, {
                    browserName: 'chrome',
                    'wdio:chromiumVersion': '130.0.6723.58'
                })
            ).rejects.toThrow('Download failed')

            expect(mockResolveBuildId).not.toHaveBeenCalledWith(
                Browser.CHROMEDRIVER,
                expect.anything(),
                expect.anything()
            )
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

        it('should parse wdio:chromiumVersion from alwaysMatch', async () => {
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome',
                alwaysMatch: {
                    'wdio:chromiumVersion': '130.0.6723.2'
                }
            } as any)

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('130.0.6723.2')
        })
    })
})
