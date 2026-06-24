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
        detectBrowserPlatform: vi.fn()
    }
})

// Import mocked functions after vi.mock() calls
const mockInstall = vi.mocked((await import('@puppeteer/browsers')).install)
const mockResolveBuildId = vi.mocked((await import('@puppeteer/browsers')).resolveBuildId)
const mockDetectBrowserPlatform = vi.mocked((await import('@puppeteer/browsers')).detectBrowserPlatform)

describe('setupChromedriver', () => {
    const originalArch = process.arch

    beforeEach(() => {
        vi.clearAllMocks()
        mockInstall.mockResolvedValue({
            executablePath: '/path/to/chromedriver',
            browser: Browser.CHROMEDRIVER,
            buildId: '130.0.6723.58',
            platform: BrowserPlatform.LINUX_ARM,
            path: '/cache/chromedriver'
        })
        mockResolveBuildId.mockResolvedValue('130.0.6723.58')
    })

    afterEach(() => {
        Object.defineProperty(process, 'arch', { value: originalArch })
    })

    describe('automatic platform-based fallback', () => {
        it('should use Electron provider on Linux ARM64 without explicit capabilities', async () => {
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)
            mockResolveBuildId.mockResolvedValueOnce('130.0.6723.58') // For resolving "stable"

            const result = await setupChromedriver('/cache', undefined, {
                browserName: 'chrome'
            })

            expect(result).toEqual({
                executablePath: '/path/to/chromedriver'
            })

            // Verify Electron provider was used
            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.providers).toBeDefined()
            expect(installCall.providers).toHaveLength(1)
        })

        it('should resolve "stable" to actual version when no Chrome installed', async () => {
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)
            mockResolveBuildId.mockResolvedValueOnce('131.0.6778.85') // Resolved stable version

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome'
            })

            // Should call resolveBuildId to get the actual version from "stable",
            // probing a CfT-served platform (LINUX) rather than the ARM target which
            // CfT has no Chrome binaries for — we only need the version number here.
            expect(mockResolveBuildId).toHaveBeenCalledWith(
                Browser.CHROME,
                BrowserPlatform.LINUX,
                'stable'
            )

            // Should install with resolved version
            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('131.0.6778.85')
        })

        it('should NOT use fallback on Linux x64', async () => {
            Object.defineProperty(process, 'arch', { value: 'x64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)

            await setupChromedriver('/cache', '130.0.6723.58', {
                browserName: 'chrome'
            })

            // Verify standard Chrome for Testing was used (no providers)
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

            // Verify standard Chrome for Testing was used (no providers)
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

            // Verify Electron provider was used
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

            // Verify standard Chrome for Testing was used (no providers)
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

            // Should use explicit version, not resolve stable
            expect(mockResolveBuildId).not.toHaveBeenCalled()

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('33.2.1')
        })
    })

    describe('version detection priority', () => {
        it('should use driverVersion parameter if provided', async () => {
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)

            await setupChromedriver('/cache', '129.0.6668.70', {
                browserName: 'chrome'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('129.0.6668.70')

            // Should not try to resolve stable
            expect(mockResolveBuildId).not.toHaveBeenCalledWith(
                Browser.CHROME,
                expect.anything(),
                'stable'
            )
        })

        it('should detect Chrome version if installed', async () => {
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX)

            // Mock os.platform to return non-Windows so it uses the Unix code path
            const os = await import('node:os')
            vi.spyOn(os.default, 'platform').mockReturnValue('linux')

            const { locateChrome } = await import('locate-app')
            vi.mocked(locateChrome).mockResolvedValue('/usr/bin/google-chrome')

            // Mock getBuildIdByChromePath to return a version
            const childProcess = await import('node:child_process')
            vi.spyOn(childProcess.default, 'spawnSync').mockReturnValue({
                pid: 123,
                output: [],
                stdout: 'Google Chrome 130.0.6723.116\n',
                stderr: '',
                status: 0,
                signal: null
            })

            await setupChromedriver('/cache', undefined, {
                browserName: 'chrome'
            })

            const installCall = mockInstall.mock.calls[0][0]
            expect(installCall.buildId).toBe('130.0.6723.116')
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
            // The Chrome-for-Testing fallback path was exercised
            expect(mockResolveBuildId).toHaveBeenCalledWith(
                Browser.CHROMEDRIVER,
                BrowserPlatform.MAC,
                expect.anything()
            )
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

        it('should re-throw the original error on platforms Chrome for Testing does not serve', async () => {
            // Linux ARM64 has no CfT Chromedriver, so there is no fallback to attempt: the
            // original Electron download error must surface unchanged rather than being
            // replaced by a confusing Chrome-for-Testing API error from the fallback path.
            mockDetectBrowserPlatform.mockReturnValue(BrowserPlatform.LINUX_ARM)
            mockResolveBuildId.mockResolvedValue('130.0.0.0')
            mockInstall.mockRejectedValue(new Error('Download failed'))

            await expect(
                setupChromedriver('/cache', undefined, {
                    browserName: 'chrome',
                    'wdio:chromiumVersion': '130.0.6723.58'
                })
            ).rejects.toThrow('Download failed')

            // No Chrome-for-Testing chromedriver resolution should be attempted on this platform
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
