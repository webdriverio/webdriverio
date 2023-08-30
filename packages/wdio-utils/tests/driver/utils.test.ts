import os from 'node:os'
import path from 'node:path'
import url from 'node:url'
import type fs from 'node:fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { canDownload, resolveBuildId, detectBrowserPlatform } from '@puppeteer/browsers'
import { locateChrome } from 'locate-app'

import { parseParams, getBuildIdByChromePath, getBuildIdByFirefoxPath, setupPuppeteerBrowser, definesRemoteDriver } from '../../src/driver/utils.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

vi.mock('node:os', () => ({
    default: {
        tmpdir: vi.fn().mockReturnValue('/tmp'),
        platform: vi.fn().mockReturnValue('darwin')
    }
}))

vi.mock('locate-app', () => ({
    locateChrome: vi.fn().mockResolvedValue('/path/to/chrome'),
    locateFirefox: vi.fn().mockResolvedValue('/path/to/firefox')
}))

vi.mock('node:fs', () => ({
    default: {
        readdirSync: vi.fn().mockReturnValue([
            '114.0.5735.199',
            '115.0.5790.110',
            'chrome.exe',
            'chrome.VisualElementsManifest.xml',
            'chrome_proxy.exe',
            'master_preferences',
            'new_chrome.exe',
            'new_chrome_proxy.exe',
            'SetupMetrics'
        ])
    }
}))

vi.mock('node:fs/promises', () => ({
    default: {
        mkdir: vi.fn().mockResolvedValue({}),
        access: vi.fn().mockResolvedValue({}),
        readFile: vi.fn(async () => {
            const { readFileSync } = await vi.importActual<typeof fs>('node:fs')
            return readFileSync(path.resolve(__dirname, '__fixtures__', 'application.ini'))
        })
    }
}))

vi.mock('node:child_process', () => ({
    default: {
        execSync: vi.fn().mockReturnValue(Buffer.from('Google Chrome 116.0.5845.110 \n'))
    }
}))

vi.mock('@puppeteer/browsers', () => ({
    Browser: { CHROME: 'chrome', FIREFOX: 'firefox' },
    ChromeReleaseChannel: { STABLE: 'stable' },
    detectBrowserPlatform: vi.fn(),
    resolveBuildId: vi.fn().mockReturnValue('116.0.5845.110'),
    canDownload: vi.fn().mockResolvedValue(true),
    computeExecutablePath: vi.fn().mockReturnValue('/foo/bar/executable'),
    install: vi.fn()
}))

describe('driver utils', () => {
    it('should parse params', () => {
        expect(parseParams({ baseUrl: 'foobar', silent: true, verbose: false, allowedIps: ['123', '321'] }))
            .toMatchSnapshot()
    })

    it('getBuildIdByChromePath', () => {
        expect(getBuildIdByChromePath()).toBe(undefined)
        expect(getBuildIdByChromePath('/foo/bar')).toBe('116.0.5845.110')

        vi.mocked(os.platform).mockReturnValueOnce('win32')
        expect(getBuildIdByChromePath('/foo/bar')).toBe('115.0.5790.110')
    })

    it('getBuildIdByFirefoxPath', async () => {
        expect(await getBuildIdByFirefoxPath()).toBe(undefined)
        expect(await getBuildIdByFirefoxPath('/foo/bar')).toBe('116.0.5845.110')

        vi.mocked(os.platform).mockReturnValueOnce('win32')
        expect(await getBuildIdByFirefoxPath('/foo/bar')).toBe('116.0.3')
    })

    describe('setupPuppeteerBrowser', () => {
        beforeEach(() => {
            vi.mocked(resolveBuildId).mockClear()
        })

        it('should throw if platform is not supported', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce(undefined)
            await expect(setupPuppeteerBrowser('/foo/bar', { browserName: 'chrome' })).rejects.toThrow('The current platform is not supported.')
        })

        it('should run setup for local chrome if browser version is omitted', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('mac' as any)
            await expect(setupPuppeteerBrowser('/foo/bar', {})).resolves.toEqual({
                browserVersion: '116.0.5845.110',
                executablePath: '/path/to/chrome'
            })
        })

        it('should do nothing if browser binary is defined within caps', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('mac' as any)
            await expect(setupPuppeteerBrowser('/foo/bar', {
                'goog:chromeOptions': { binary: '/my/chrome' }
            })).resolves.toEqual({
                browserVersion: '116.0.5845.110',
                executablePath: '/my/chrome'
            })
        })

        it('should install chrome stable if browser is not found', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('windows' as any)
            vi.mocked(locateChrome).mockResolvedValue('/path/to/stable')
            await expect(setupPuppeteerBrowser('/foo/bar', {})).resolves.toEqual( {
                browserVersion: '116.0.5845.110',
                executablePath: '/path/to/stable'
            })
        })

        it('should throw if browser version is not found', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('windows' as any)
            vi.mocked(canDownload).mockResolvedValueOnce(false)
            vi.mocked(locateChrome).mockRejectedValueOnce(new Error('not found'))
            await expect(setupPuppeteerBrowser('/foo/bar', { browserName: 'chrome' }))
                .rejects.toThrow(/Couldn't find a matching chrome browser/)
        })

        it('should install chrome browser with specific version provided', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('windows' as any)
            await expect(setupPuppeteerBrowser('/foo/bar', { browserVersion: '1.2.3' })).resolves.toEqual({
                browserVersion: '116.0.5845.110',
                executablePath: '/foo/bar/executable',
            })
            expect(resolveBuildId).toBeCalledWith('chrome', 'windows', '1.2.3')
        })
    })

    it('definesRemoteDriver', () => {
        expect(definesRemoteDriver({})).toBe(false)
        expect(definesRemoteDriver({ hostname: 'foo' })).toBe(true)
        expect(definesRemoteDriver({ port: 1 })).toBe(true)
        expect(definesRemoteDriver({ path: 'foo' })).toBe(true)
        expect(definesRemoteDriver({ protocol: 'foo' })).toBe(true)
        expect(definesRemoteDriver({ user: 'foo' })).toBe(false)
        expect(definesRemoteDriver({ key: 'foo' })).toBe(false)
        expect(definesRemoteDriver({ user: 'foo', key: 'bar' })).toBe(true)
    })
})
