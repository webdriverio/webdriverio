import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Browser, BrowserPlatform, type DownloadOptions } from '@puppeteer/browsers'
import path from 'node:path'
import { chromiumToElectron } from 'electron-to-chromium'

import { ElectronChromedriverProvider, resetElectronMappingCache } from '../../src/node/electronChromedriverProvider.js'

vi.mock('electron-to-chromium', () => ({
    chromiumToElectron: vi.fn()
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('ElectronChromedriverProvider', () => {
    const originalArch = process.arch

    beforeEach(() => {
        vi.clearAllMocks()
        resetElectronMappingCache()
        vi.mocked(chromiumToElectron).mockReset()
        // Reset process.arch to original before each test
        Object.defineProperty(process, 'arch', { value: originalArch, configurable: true })
    })

    describe('getName', () => {
        it('should return "electron"', () => {
            const downloader = new ElectronChromedriverProvider()
            expect(downloader.getName()).toBe('electron')
        })
    })

    describe('supports', () => {
        it('should return true for chromedriver on supported platform', async () => {
            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.LINUX_ARM
            }

            vi.mocked(chromiumToElectron).mockReturnValue('33.0.0')
            const result = await downloader.supports(options)
            expect(result).toBe(true)
        })

        it('should return false for non-chromedriver browser', async () => {
            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROME,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.LINUX_ARM
            }

            const result = await downloader.supports(options)
            expect(result).toBe(false)
        })

        it('should respect platform restriction when set', async () => {
            const downloader = new ElectronChromedriverProvider({
                platforms: [BrowserPlatform.LINUX_ARM]
            })
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.MAC_ARM
            }

            vi.mocked(chromiumToElectron).mockReturnValue('33.0.0')
            const result = await downloader.supports(options)
            expect(result).toBe(false)
        })

        it('should return false when version cannot be resolved', async () => {
            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: 'unknown.version',
                platform: BrowserPlatform.LINUX_ARM
            }

            vi.mocked(chromiumToElectron).mockReturnValue(undefined)
            const result = await downloader.supports(options)
            expect(result).toBe(false)
        })
    })

    describe('getDownloadUrl', () => {
        it('should return correct URL for Linux ARM64', async () => {
            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.LINUX_ARM
            }

            vi.mocked(chromiumToElectron).mockReturnValue('33.0.0')
            const url = await downloader.getDownloadUrl(options)

            expect(url?.toString()).toBe(
                'https://github.com/electron/electron/releases/download/v33.0.0/chromedriver-v33.0.0-linux-arm64.zip'
            )
        })

        it('should return correct URL for macOS ARM64', async () => {
            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.MAC_ARM
            }

            vi.mocked(chromiumToElectron).mockReturnValue('33.0.0')
            const url = await downloader.getDownloadUrl(options)

            expect(url?.toString()).toBe(
                'https://github.com/electron/electron/releases/download/v33.0.0/chromedriver-v33.0.0-darwin-arm64.zip'
            )
        })

        it('should return correct URL for Windows x64', async () => {
            // Explicitly set x64 arch for this test
            Object.defineProperty(process, 'arch', { value: 'x64', configurable: true })

            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.WIN64
            }

            vi.mocked(chromiumToElectron).mockReturnValue('33.0.0')
            const url = await downloader.getDownloadUrl(options)

            expect(url?.toString()).toBe(
                'https://github.com/electron/electron/releases/download/v33.0.0/chromedriver-v33.0.0-win32-x64.zip'
            )
        })

        it('should return correct URL for Windows ARM64', async () => {
            // Mock Windows ARM64 environment
            Object.defineProperty(process, 'arch', { value: 'arm64', configurable: true })

            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.WIN64 // detectBrowserPlatform returns WIN64 for ARM64 too
            }

            vi.mocked(chromiumToElectron).mockReturnValue('33.0.0')
            const url = await downloader.getDownloadUrl(options)

            expect(url?.toString()).toBe(
                'https://github.com/electron/electron/releases/download/v33.0.0/chromedriver-v33.0.0-win32-arm64.zip'
            )
        })

        it('should pass through Electron version directly', async () => {
            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '33.0.0',
                platform: BrowserPlatform.LINUX_ARM
            }

            const url = await downloader.getDownloadUrl(options)

            expect(url?.toString()).toBe(
                'https://github.com/electron/electron/releases/download/v33.0.0/chromedriver-v33.0.0-linux-arm64.zip'
            )
        })

        it('should return null when version cannot be resolved', async () => {
            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: 'unknown.version',
                platform: BrowserPlatform.LINUX_ARM
            }

            vi.mocked(chromiumToElectron).mockReturnValue(undefined)
            const url = await downloader.getDownloadUrl(options)

            expect(url).toBeNull()
        })

        it('should use custom baseUrl when provided', async () => {
            const downloader = new ElectronChromedriverProvider({
                baseUrl: 'https://custom-mirror.example.com/electron/releases/'
            })
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '33.0.0',
                platform: BrowserPlatform.LINUX_ARM
            }

            const url = await downloader.getDownloadUrl(options)

            expect(url?.toString()).toBe(
                'https://custom-mirror.example.com/electron/releases/v33.0.0/chromedriver-v33.0.0-linux-arm64.zip'
            )
        })
    })

    describe('getExecutablePath', () => {
        it('should return chromedriver for non-Windows platforms', () => {
            const downloader = new ElectronChromedriverProvider()
            const result = downloader.getExecutablePath({
                browser: Browser.CHROMEDRIVER,
                buildId: '33.0.0',
                platform: BrowserPlatform.LINUX_ARM
            })

            expect(result).toBe('chromedriver')
        })

        it('should return chromedriver.exe for Windows platforms', () => {
            const downloader = new ElectronChromedriverProvider()
            const result = downloader.getExecutablePath({
                browser: Browser.CHROMEDRIVER,
                buildId: '33.0.0',
                platform: BrowserPlatform.WIN64
            })

            expect(result).toBe('chromedriver.exe')
        })
    })

    describe('version mapping', () => {
        it('should use custom version mapping when provided', async () => {
            const downloader = new ElectronChromedriverProvider({
                versionMapping: {
                    '130.0.6723.2': '34.0.0'
                }
            })
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.LINUX_ARM
            }

            const url = await downloader.getDownloadUrl(options)

            expect(url?.toString()).toContain('v34.0.0')
        })

        it('should handle array return from chromiumToElectron', async () => {
            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.LINUX_ARM
            }

            vi.mocked(chromiumToElectron).mockReturnValue(['33.1.0', '33.0.0'] as any)
            const url = await downloader.getDownloadUrl(options)

            expect(url?.toString()).toContain('v33.1.0')
        })

        it('should treat a 3-part Chromium-range version as Chromium, not an Electron version', async () => {
            // A bare 3-part id whose major sits in Chromium's range (>= 100) must be mapped
            // via the lookup, not passed straight through as if it were an Electron version.
            const realFetch = globalThis.fetch
            globalThis.fetch = vi.fn().mockRejectedValue(new Error('offline')) as unknown as typeof fetch
            vi.mocked(chromiumToElectron).mockReturnValue('33.0.0')

            try {
                const downloader = new ElectronChromedriverProvider()
                const url = await downloader.getDownloadUrl({
                    browser: Browser.CHROMEDRIVER,
                    buildId: '130.0.6723',
                    platform: BrowserPlatform.LINUX_ARM
                })

                expect(chromiumToElectron).toHaveBeenCalledWith('130.0.6723')
                expect(url?.toString()).toContain('v33.0.0')
                expect(url?.toString()).not.toContain('v130.0.6723')
            } finally {
                globalThis.fetch = realFetch
            }
        })
    })

    describe('electronjs.org mapping fetch', () => {
        const realFetch = globalThis.fetch

        afterEach(() => {
            globalThis.fetch = realFetch
        })

        const okResponse = (body: unknown) => ({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => body
        })

        it('resolves a Chromium version from the fetched electronjs.org mapping', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue(
                okResponse([{ chrome: '130.0.6723.2', version: '33.2.1' }])
            ) as unknown as typeof fetch

            const downloader = new ElectronChromedriverProvider()
            const url = await downloader.getDownloadUrl({
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.LINUX_ARM
            })

            expect(url?.toString()).toContain('v33.2.1')
            // The package fallback should not be needed when the fetch succeeds
            expect(chromiumToElectron).not.toHaveBeenCalled()
        })

        it('falls back to the electron-to-chromium package on a non-2xx response', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 429,
                statusText: 'Too Many Requests',
                // A rate-limit body can still parse as JSON; the ok check must run first
                json: async () => ({ message: 'rate limited' })
            }) as unknown as typeof fetch
            vi.mocked(chromiumToElectron).mockReturnValue('33.0.0')

            const downloader = new ElectronChromedriverProvider()
            const url = await downloader.getDownloadUrl({
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.LINUX_ARM
            })

            expect(chromiumToElectron).toHaveBeenCalledWith('130.0.6723.2')
            expect(url?.toString()).toContain('v33.0.0')
        })

        it('does not cache a failed fetch, so a later call retries', async () => {
            const fetchMock = vi.fn()
                .mockResolvedValueOnce({ ok: false, status: 503, statusText: 'Unavailable', json: async () => ({}) })
                .mockResolvedValueOnce(okResponse([{ chrome: '130.0.6723.2', version: '33.2.1' }]))
            globalThis.fetch = fetchMock as unknown as typeof fetch
            vi.mocked(chromiumToElectron).mockReturnValue('33.0.0')

            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.LINUX_ARM
            }

            // First call: fetch fails → package fallback (v33.0.0)
            const first = await downloader.getDownloadUrl(options)
            expect(first?.toString()).toContain('v33.0.0')

            // Second call: cache was evicted on failure, so the fetch is retried and now succeeds
            const second = await downloader.getDownloadUrl(options)
            expect(second?.toString()).toContain('v33.2.1')
            expect(fetchMock).toHaveBeenCalledTimes(2)
        })

        it('shares a single in-flight fetch between concurrent supports() and getDownloadUrl()', async () => {
            const fetchMock = vi.fn().mockResolvedValue(
                okResponse([{ chrome: '130.0.6723.2', version: '33.2.1' }])
            )
            globalThis.fetch = fetchMock as unknown as typeof fetch

            const downloader = new ElectronChromedriverProvider()
            const options: DownloadOptions = {
                browser: Browser.CHROMEDRIVER,
                buildId: '130.0.6723.2',
                platform: BrowserPlatform.LINUX_ARM
            }

            const [supported, url] = await Promise.all([
                downloader.supports(options),
                downloader.getDownloadUrl(options)
            ])

            expect(supported).toBe(true)
            expect(url?.toString()).toContain('v33.2.1')
            // Both code paths shared one network request rather than each firing its own
            expect(fetchMock).toHaveBeenCalledTimes(1)
        })
    })
})
