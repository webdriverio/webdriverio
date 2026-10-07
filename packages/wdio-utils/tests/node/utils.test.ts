import os from 'node:os'
import fsp from 'node:fs/promises'
import path from 'node:path'
import url from 'node:url'
import cp from 'node:child_process'
import fs from 'node:fs'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'
import { Cache, canDownload, resolveBuildId, detectBrowserPlatform, install, computeExecutablePath } from '@puppeteer/browsers'
import { locateChrome, locateApp } from 'locate-app'

import {
    parseParams, getBuildIdByChromePath, getBuildIdByFirefoxPath, setupPuppeteerBrowser,
    canAccess, getCacheDir, setupChromedriver
} from '../../src/node/utils.js'

const __dirname = path.dirname(url.fileURLToPath(import.meta.url))

vi.mock('fs', () => import(path.join(process.cwd(), '__mocks__', 'fs')))
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
const { logMock } = await import(path.join(process.cwd(), '__mocks__', '@wdio/logger')) as { logMock: Record<string, Mock> }

vi.mock('node:os', () => ({
    default: {
        tmpdir: vi.fn().mockReturnValue('/tmp'),
        platform: vi.fn().mockReturnValue('darwin')
    }
}))

vi.mock('locate-app', () => ({
    locateChrome: vi.fn().mockResolvedValue('/path/to/chrome'),
    locateFirefox: vi.fn().mockResolvedValue('/path/to/firefox'),
    locateApp: vi.fn().mockResolvedValue('/path/to/chromium')
}))

vi.mock('node:fs', () => ({
    default: {
        accessSync: vi.fn(),
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
        rm: vi.fn().mockResolvedValue(undefined),
        readFile: vi.fn(async () => {
            const { readFileSync } = await vi.importActual<typeof fs>('node:fs')
            return readFileSync(path.resolve(__dirname, '__fixtures__', 'application.ini'))
        })
    }
}))

vi.mock('node:child_process', () => ({
    default: {
        execSync: vi.fn(),
        spawnSync: vi.fn()
    }
}))

vi.mock('@puppeteer/browsers', () => ({
    Cache: vi.fn(function () {
        return { installationDir: () => '/foo/bar' }
    }),
    Browser: { CHROME: 'chrome', FIREFOX: 'firefox', CHROMIUM: 'chromium' },
    ChromeReleaseChannel: { STABLE: 'stable' },
    detectBrowserPlatform: vi.fn(),
    resolveBuildId: vi.fn().mockReturnValue('116.0.5845.110'),
    canDownload: vi.fn().mockResolvedValue(true),
    computeExecutablePath: vi.fn().mockReturnValue('/foo/bar/executable'),
    install: vi.fn().mockResolvedValue({})
}))

describe('setupChromedriver', () => {
    /**
     * `chrome` and `chromium` are both in the Chrome browser family, so a config with
     * both asks for Chromedriver twice at the same time. The two installs used to race
     * on one cache directory and the loser saw a folder that existed but had no
     * executable in it yet (#15676).
     */
    it('shares one install between concurrent setups of the same driver', async () => {
        const fsp = (await import('node:fs/promises')).default
        vi.mocked(detectBrowserPlatform).mockReturnValue('linux' as never)
        vi.mocked(fsp.access).mockRejectedValue(new Error('not installed yet'))
        vi.mocked(install).mockClear()
        vi.mocked(install).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({} as never), 10))
        )

        try {
            await Promise.all([
                setupChromedriver('/some/cache', '116.0.5845.110'),
                setupChromedriver('/some/cache', '116.0.5845.110')
            ])

            expect(install).toBeCalledTimes(1)
        } finally {
            vi.mocked(fsp.access).mockResolvedValue(undefined as never)
            vi.mocked(install).mockResolvedValue({} as never)
        }
    })

    it('shares one install between version requests that resolve to the same build', async () => {
        const fsp = (await import('node:fs/promises')).default
        vi.mocked(detectBrowserPlatform).mockReturnValue('linux' as never)
        vi.mocked(fsp.access).mockRejectedValue(new Error('not installed yet'))
        vi.mocked(install).mockClear()
        vi.mocked(install).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({} as never), 10))
        )

        try {
            /**
             * `resolveBuildId` maps both of these onto the same build, so keying on the
             * raw version string would let them race even though they want one download
             */
            await Promise.all([
                setupChromedriver('/some/cache', 'stable'),
                setupChromedriver('/some/cache', '116')
            ])

            expect(install).toBeCalledTimes(1)
        } finally {
            vi.mocked(fsp.access).mockResolvedValue(undefined as never)
            vi.mocked(install).mockResolvedValue({} as never)
        }
    })

    it('lets a later call retry after a shared install failed', async () => {
        const fsp = (await import('node:fs/promises')).default
        vi.mocked(detectBrowserPlatform).mockReturnValue('linux' as never)
        vi.mocked(fsp.access).mockRejectedValue(new Error('not installed yet'))
        vi.mocked(install).mockClear()
        vi.mocked(install).mockRejectedValue(new Error('network is down'))

        try {
            await expect(setupChromedriver('/retry/cache', '116.0.5845.110')).rejects.toThrow()
            const callsAfterFailure = vi.mocked(install).mock.calls.length
            expect(callsAfterFailure).toBeGreaterThan(0)

            /**
             * the rejected promise must not stay in the map, otherwise every later
             * setup for the same driver would fail without ever downloading again
             */
            vi.mocked(install).mockResolvedValue({} as never)
            await setupChromedriver('/retry/cache', '116.0.5845.110')

            expect(vi.mocked(install).mock.calls.length).toBeGreaterThan(callsAfterFailure)
        } finally {
            vi.mocked(fsp.access).mockResolvedValue(undefined as never)
            vi.mocked(install).mockResolvedValue({} as never)
        }
    })

    it('does not share an install between different cache directories', async () => {
        const fsp = (await import('node:fs/promises')).default
        vi.mocked(detectBrowserPlatform).mockReturnValue('linux' as never)
        vi.mocked(fsp.access).mockRejectedValue(new Error('not installed yet'))
        vi.mocked(install).mockClear()
        vi.mocked(install).mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({} as never), 10))
        )

        try {
            await Promise.all([
                setupChromedriver('/cache/one', '116.0.5845.110'),
                setupChromedriver('/cache/two', '116.0.5845.110')
            ])

            expect(install).toBeCalledTimes(2)
        } finally {
            vi.mocked(fsp.access).mockResolvedValue(undefined as never)
            vi.mocked(install).mockResolvedValue({} as never)
        }
    })
})

describe('driver utils', () => {
    beforeEach(() => {
        vi.mocked(cp.spawnSync).mockReturnValue({
            pid: 123,
            output: [],
            stdout: 'Google Chrome 116.0.5845.110 \n',
            stderr: '',
            status: 0,
            signal: null
        })
    })

    describe('getCacheDir', () => {
        afterEach(() => vi.unstubAllEnvs())

        it('uses WEBDRIVER_CACHE_DIR when no cache directory is configured', () => {
            vi.stubEnv('WEBDRIVER_CACHE_DIR', '/environment/cache')

            expect(getCacheDir({}, {})).toBe('/environment/cache')
        })

        it('prefers configured cache directories over WEBDRIVER_CACHE_DIR', () => {
            vi.stubEnv('WEBDRIVER_CACHE_DIR', '/environment/cache')

            expect(getCacheDir({ cacheDir: '/options/cache' }, {})).toBe('/options/cache')
            expect(getCacheDir(
                { cacheDir: '/options/cache' },
                { 'wdio:chromedriverOptions': { cacheDir: '/driver/cache' } }
            )).toBe('/driver/cache')
        })
    })

    it('should parse params', () => {
        expect(parseParams({ baseUrl: 'foobar', silent: true, verbose: false, allowedIps: ['123', '321'] }))
            .toMatchSnapshot()
    })

    it('getBuildIdByChromePath', () => {
        expect(getBuildIdByChromePath()).toBe(undefined)
        expect(getBuildIdByChromePath('/foo/bar')).toBe('116.0.5845.110')
        expect(cp.spawnSync).toBeCalledWith('/foo/bar', ['--version', '--no-sandbox'], expect.any(Object))
        vi.mocked(cp.spawnSync).mockReturnValue({
            pid: 123,
            output: [],
            stdout: 'Chromium 117.0.5938.88 Fedora Project \n',
            stderr: '',
            status: 0,
            signal: null
        })
        expect(getBuildIdByChromePath('/foo/bar')).toBe('117.0.5938.88')
        vi.mocked(cp.spawnSync).mockReturnValue({
            pid: 123,
            output: [],
            stdout: 'Chromium 117.0.5938.92 snap \n',
            stderr: '',
            status: 0,
            signal: null
        })
        expect(getBuildIdByChromePath('/foo/bar')).toBe('117.0.5938.92')
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
            await expect(setupPuppeteerBrowser('/foo/bar', {
                'goog:chromeOptions': { binary: '/my/chrome' }
            })).resolves.toEqual({
                browserVersion: '116.0.5845.110',
                executablePath: '/my/chrome'
            })
            await expect(setupPuppeteerBrowser('/foo/bar', {
                browserVersion: '1.2.3',
                'goog:chromeOptions': { binary: '/my/chrome' }
            })).resolves.toEqual({
                browserVersion: '1.2.3',
                executablePath: '/my/chrome'
            })
        })

        it('should install chrome stable if browser is not found', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('windows' as any)
            vi.mocked(locateChrome).mockResolvedValue('/path/to/stable')
            await expect(setupPuppeteerBrowser('/foo/bar', {})).resolves.toEqual({
                browserVersion: '116.0.5845.110',
                executablePath: '/path/to/stable'
            })
            expect(resolveBuildId).toBeCalledTimes(0)
        })

        it('should look for Chromium browser if defined as browser name', async () => {
            vi.mocked(detectBrowserPlatform).mockReturnValueOnce('windows' as any)
            vi.mocked(locateApp).mockResolvedValue('')
            const caps = { browserName: 'chromium' }
            await expect(setupPuppeteerBrowser('/foo/bar', caps)).resolves.toEqual( {
                browserVersion: '116.0.5845.110',
                executablePath: '/foo/bar/executable'
            })
            expect(caps.browserName).toBe('chrome')
            expect(resolveBuildId).toBeCalledTimes(2)
            expect(resolveBuildId).toBeCalledWith('chromium', 'windows', 'latest')
            expect(resolveBuildId).toBeCalledWith('chrome', 'windows', 'latest')
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

        describe('retry after a failed install', () => {
            const installationDir = path.join('/cache', 'firefox', 'win64-stable_157.0')
            const executablePath = path.join(installationDir, 'core', 'firefox.exe')
            let cacheExecutablePath: () => string

            beforeEach(() => {
                cacheExecutablePath = () => executablePath
                vi.mocked(detectBrowserPlatform).mockReturnValue('win64' as any)
                vi.mocked(resolveBuildId).mockResolvedValueOnce('stable_157.0' as never)
                vi.mocked(Cache).mockImplementationOnce(function () {
                    return {
                        installationDir: () => installationDir,
                        computeExecutablePath: () => cacheExecutablePath()
                    }
                } as never)
                vi.mocked(computeExecutablePath).mockReturnValue(executablePath)
                vi.mocked(fsp.rm).mockClear()
                logMock.info.mockClear()
                logMock.warn.mockClear()
            })

            afterEach(() => {
                vi.mocked(detectBrowserPlatform).mockReset()
                vi.mocked(computeExecutablePath).mockReturnValue('/foo/bar/executable')
                vi.mocked(fsp.access).mockReset().mockResolvedValue({} as never)
                vi.mocked(fsp.rm).mockReset().mockResolvedValue(undefined)
            })

            const executableIsMissing = () => vi.mocked(fsp.access).mockImplementation(async (file) => {
                if (file === executablePath) {
                    throw new Error('ENOENT')
                }
            })

            /**
             * The Firefox executable sits in a `core` sub-folder of the build folder on
             * Windows. Removing only that sub-folder left the build folder in place, so
             * the retry failed with "exists but the executable is missing" again.
             */
            it('removes the whole build folder when the executable is missing', async () => {
                executableIsMissing()
                vi.mocked(install).mockRejectedValueOnce(new Error('The browser folder exists but the executable is missing'))

                await setupPuppeteerBrowser('/cache', { browserName: 'firefox', browserVersion: 'stable' })

                expect(fsp.rm).toHaveBeenCalledTimes(1)
                expect(fsp.rm).toHaveBeenCalledWith(installationDir, { recursive: true, force: true })
                expect(logMock.warn).toHaveBeenCalledWith(`Removing ${installationDir} before the retry: the executable ${executablePath} is missing`)
                expect(install).toHaveBeenLastCalledWith(expect.objectContaining({ browser: 'firefox', buildId: 'stable_157.0' }))
            })

            /**
             * a failed download stops before the build folder is made, so there is
             * nothing to remove and nothing to warn about
             */
            it('does not remove or warn when the build folder does not exist', async () => {
                vi.mocked(fsp.access).mockImplementation(async (file) => {
                    if (file === executablePath || file === installationDir) {
                        throw new Error('ENOENT')
                    }
                })
                vi.mocked(install).mockRejectedValueOnce(new Error('connect ECONNREFUSED'))

                await setupPuppeteerBrowser('/cache', { browserName: 'firefox', browserVersion: 'stable' })

                expect(fsp.rm).not.toHaveBeenCalled()
                expect(logMock.warn).not.toHaveBeenCalled()
                expect(logMock.info).not.toHaveBeenCalledWith(expect.stringContaining('Keeping'))
                expect(install).toHaveBeenLastCalledWith(expect.objectContaining({ browser: 'firefox', buildId: 'stable_157.0' }))
            })

            it('still retries when the build folder cannot be removed', async () => {
                executableIsMissing()
                vi.mocked(fsp.rm).mockRejectedValueOnce(new Error('EPERM: operation not permitted'))
                vi.mocked(install).mockRejectedValueOnce(new Error('The browser folder exists but the executable is missing'))

                await setupPuppeteerBrowser('/cache', { browserName: 'firefox', browserVersion: 'stable' })

                expect(logMock.warn).toHaveBeenCalledWith(`Couldn't remove ${installationDir}, the retry can fail: EPERM: operation not permitted`)
                expect(install).toHaveBeenLastCalledWith(expect.objectContaining({ browser: 'firefox', buildId: 'stable_157.0' }))
            })

            it('still retries when the cleanup fails', async () => {
                cacheExecutablePath = () => {
                    throw new Error('.metadata is not an object')
                }
                vi.mocked(install).mockRejectedValueOnce(new Error('download failed'))

                await setupPuppeteerBrowser('/cache', { browserName: 'firefox', browserVersion: 'stable' })

                expect(fsp.rm).not.toHaveBeenCalled()
                expect(install).toHaveBeenLastCalledWith(expect.objectContaining({ browser: 'firefox', buildId: 'stable_157.0' }))
            })

            /**
             * On Windows the Firefox installer can stay locked after it extracted the
             * browser, so the install fails when it deletes the installer. The browser
             * is complete, so the retry uses it. Removing it makes the retry download
             * and extract it again, and Windows can lock the installer again.
             */
            it('keeps the build folder when the executable is there', async () => {
                vi.mocked(install).mockRejectedValueOnce(new Error('EBUSY: resource busy or locked, unlink \'Firefox Setup 157.0.exe\''))

                await setupPuppeteerBrowser('/cache', { browserName: 'firefox', browserVersion: 'stable' })

                expect(fsp.access).toHaveBeenCalledWith(executablePath)
                expect(fsp.rm).not.toHaveBeenCalled()
                expect(logMock.info).toHaveBeenCalledWith(`Keeping firefox vstable_157.0 at ${installationDir}: the executable is there`)
                expect(logMock.warn).not.toHaveBeenCalled()
                expect(install).toHaveBeenLastCalledWith(expect.objectContaining({ browser: 'firefox', buildId: 'stable_157.0' }))
            })
        })
    })
})

describe('utils:canAccess', () => {
    it('canAccess', () => {
        expect(canAccess('/foobar')).toBe(true)
        expect(fs.accessSync).toBeCalledWith('/foobar')

        // @ts-ignore
        fs.accessSync.mockImplementation(() => {
            throw new Error('upps')
        })
        expect(canAccess('/foobar')).toBe(false)
    })
})
