import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Browser, BrowserPlatform, type DownloadOptions } from '@puppeteer/browsers'
import path from 'node:path'
import { chromiumToElectron } from 'electron-to-chromium'

import { ElectronChromedriverProvider, resetElectronMappingCache } from '../../src/node/electronChromedriverProvider.js'

vi.mock('electron-to-chromium', () => ({
    chromiumToElectron: vi.fn()
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

describe('ElectronChromedriverProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        resetElectronMappingCache()
        vi.mocked(chromiumToElectron).mockReset()
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
    })
})
