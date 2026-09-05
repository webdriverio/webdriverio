import fsp from 'node:fs/promises'
import cp from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest'

import split2 from 'split2'
import waitPort from 'wait-port'
import { start as startSafaridriver } from 'safaridriver'
import { start as startGeckodriver } from 'geckodriver'
import { start as startEdgedriver, download as downloadEdgedriver } from 'edgedriver'
import { install, canDownload } from '@puppeteer/browsers'

import { startWebDriver } from '../../src/node/index.js'
import { DEFAULT_EDGEDRIVER_CDN_URL, setupChromedriver, setupEdgedriver } from '../../src/node/utils.js'
import { SUPPORTED_BROWSERNAMES } from '../../src/constants.js'

vi.mock('split2', () => ({ default: vi.fn() }))

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockRejectedValue(new Error('boom')),
        mkdir: vi.fn()
    }
}))

vi.mock('node:fs', () => ({
    default: {
        createWriteStream: vi.fn()
    }
}))

vi.mock('node:os', async (origMod) => {
    const actual = await origMod<any>()
    const platformMock = vi.fn().mockReturnValue('linux')

    return {
        default: {
            ...actual,
            platform: platformMock,
            __setPlatform: (val: string) => platformMock.mockReturnValue(val)
        }
    }
})

vi.mock('node:child_process', () => ({
    default: {
        spawn: vi.fn().mockReturnValue({
            stdout: { pipe: vi.fn().mockReturnValue({ on: vi.fn() }) },
            stderr: { pipe: vi.fn().mockReturnValue({ on: vi.fn() }) }
        }),
        execSync: vi.fn().mockReturnValue(Buffer.from('115.0.5790.171'))
    }
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
const { logMock } = await import(path.join(process.cwd(), '__mocks__', '@wdio/logger')) as { logMock: Record<string, Mock> }
vi.mock('webdriver', () => ({ default: 'webdriver package' }))
vi.mock('safaridriver', () => ({
    start: vi.fn().mockReturnValue({
        stdout: { pipe: vi.fn().mockReturnValue({ on: vi.fn() }) },
        stderr: { pipe: vi.fn().mockReturnValue({ on: vi.fn() }) }
    })
}))
vi.mock('edgedriver', () => ({
    download: vi.fn().mockResolvedValue('/foo/bar/edgedriver'),
    start: vi.fn().mockResolvedValue('edgedriver'),
    findEdgePath: vi.fn().mockReturnValue('/foo/bar/executable')
}))
vi.mock('geckodriver', () => ({ start: vi.fn().mockResolvedValue('geckodriver') }))
vi.mock('wait-port', () => ({ default: vi.fn().mockResolvedValue(undefined) }))
vi.mock('get-port', () => ({ default: vi.fn().mockResolvedValue(1234) }))

vi.mock('@puppeteer/browsers', () => ({
    Browser: { CHROME: 'chrome', CHROMEDRIVER: 'chromedriver' },
    ChromeReleaseChannel: { STABLE: 'stable' },
    detectBrowserPlatform: vi.fn().mockReturnValue('mac_arm'),
    resolveBuildId: vi.fn().mockReturnValue('115.0.5790.171'),
    canDownload: vi.fn().mockResolvedValue(true),
    computeExecutablePath: vi.fn().mockReturnValue('/foo/bar/executable'),
    getInstalledBrowsers: vi.fn().mockResolvedValue([]),
    install: vi.fn().mockResolvedValue({})
}))

vi.mock('../../src/node/utils.js', async (actualMod) => ({
    ...(await actualMod() as any),
    setupPuppeteerBrowser: vi.fn().mockResolvedValue({
        executablePath: '/path/to/browser',
        browserVersion: '1.2.3'
    })
}))

describe('startWebDriver', () => {
    const WDIO_SKIP_DRIVER_SETUP = process.env.WDIO_SKIP_DRIVER_SETUP
    const EDGEDRIVER_CDNURL = process.env.EDGEDRIVER_CDNURL
    const CHROMEDRIVER_CDNURL = process.env.CHROMEDRIVER_CDNURL
    beforeEach(() => {
        delete process.env.WDIO_SKIP_DRIVER_SETUP
        delete process.env.EDGEDRIVER_CDNURL
        delete process.env.CHROMEDRIVER_CDNURL
        vi.mocked(canDownload).mockClear()
        /**
         * reset rather than clear so that a test which makes the install fail can
         * never leak its rejection into the tests that run after it
         */
        vi.mocked(install).mockReset()
        vi.mocked(install).mockResolvedValue({} as never)
        vi.mocked(logMock.error).mockClear()
        vi.mocked(logMock.warn).mockClear()
        vi.mocked(fsp.access).mockClear()
        vi.mocked(fsp.mkdir).mockClear()
        vi.mocked(cp.spawn).mockClear()
        vi.mocked(startGeckodriver).mockClear()
        vi.mocked(startEdgedriver).mockClear()
        vi.mocked(downloadEdgedriver).mockClear()
        vi.mocked(fs.createWriteStream).mockClear()
    })

    afterEach(() => {
        process.env.WDIO_SKIP_DRIVER_SETUP = WDIO_SKIP_DRIVER_SETUP
        if (EDGEDRIVER_CDNURL) {
            process.env.EDGEDRIVER_CDNURL = EDGEDRIVER_CDNURL
        } else {
            delete process.env.EDGEDRIVER_CDNURL
        }
        if (CHROMEDRIVER_CDNURL !== undefined) {
            process.env.CHROMEDRIVER_CDNURL = CHROMEDRIVER_CDNURL
        } else {
            delete process.env.CHROMEDRIVER_CDNURL
        }
    })

    it('should start safari driver', async () => {
        const params = {
            capabilities: {
                browserName: 'safari',
                'wdio:safaridriverOptions': { foo: 'bar' }
            } as any
        }
        await expect(startWebDriver(params)).resolves.toEqual(expect.objectContaining({
            stdout: expect.any(Object),
            stderr: expect.any(Object)
        }))
        await expect(params).toEqual({
            hostname: 'localhost',
            port: 1234,
            capabilities: {
                browserName: 'safari',
                'wdio:safaridriverOptions': {
                    foo: 'bar'
                },
            }
        })
        expect(startSafaridriver).toBeCalledTimes(1)
        expect(startSafaridriver).toBeCalledWith({
            port: 1234,
            foo: 'bar',
            useTechnologyPreview: false
        })
        expect(split2).toBeCalledTimes(2)
    })

    it('should start firefox driver', async () => {
        const params = {
            capabilities: {
                browserName: 'firefox',
                'wdio:geckodriverOptions': { foo: 'bar' }
            } as any
        }
        await expect(startWebDriver(params)).resolves.toBe('geckodriver')
        expect(params).toEqual({
            hostname: 'localhost',
            port: 1234,
            capabilities: {
                browserName: 'firefox',
                'moz:firefoxOptions': {
                    binary: '/path/to/browser'
                },
                'wdio:geckodriverOptions': {
                    foo: 'bar'
                },
            }
        })
        expect(startGeckodriver).toBeCalledTimes(1)
        expect(startGeckodriver).toBeCalledWith({
            port: 1234,
            foo: 'bar',
            cacheDir: expect.any(String),
            allowHosts: ['localhost'],
        })
    })

    it('should start edge driver', async () => {
        process.env.EDGEDRIVER_CDNURL = 'https://msedgedriver.azureedge.net'
        const options = {
            capabilities: {
                browserName: 'edge',
                'wdio:edgedriverOptions': { foo: 'bar' }
            } as any
        }
        await expect(startWebDriver(options)).resolves.toBe('edgedriver')
        expect(options).toEqual({
            hostname: 'localhost',
            port: 1234,
            capabilities: {
                browserName: 'MicrosoftEdge',
                'wdio:edgedriverOptions': {
                    foo: 'bar'
                },
                'ms:edgeOptions': {
                    binary: '/foo/bar/executable'
                }
            }
        })
        expect(startEdgedriver).toBeCalledTimes(1)
        expect(startEdgedriver).toBeCalledWith({
            foo: 'bar',
            port: 1234,
            cacheDir: expect.any(String),
            allowedIps: ['0.0.0.0'],
        })
        expect(process.env.EDGEDRIVER_CDNURL).toBe(DEFAULT_EDGEDRIVER_CDN_URL)
        expect(options.capabilities.browserName).toBe('MicrosoftEdge')
    })

    it('should set the supported edge driver CDN before downloading edge driver', async () => {
        await expect(setupEdgedriver('/foo/bar/cache', '148.0.3967.96')).resolves.toBe('/foo/bar/edgedriver')
        expect(downloadEdgedriver).toBeCalledWith('148.0.3967.96', '/foo/bar/cache')
        expect(process.env.EDGEDRIVER_CDNURL).toBe(DEFAULT_EDGEDRIVER_CDN_URL)
    })

    it('should replace the deprecated edge driver CDN before downloading edge driver', async () => {
        process.env.EDGEDRIVER_CDNURL = 'https://msedgedriver.azureedge.net/'
        await expect(setupEdgedriver('/foo/bar/cache', '148.0.3967.96')).resolves.toBe('/foo/bar/edgedriver')
        expect(downloadEdgedriver).toBeCalledWith('148.0.3967.96', '/foo/bar/cache')
        expect(process.env.EDGEDRIVER_CDNURL).toBe(DEFAULT_EDGEDRIVER_CDN_URL)
    })

    it('should start chrome driver', async () => {
        const options = {
            capabilities: {
                browserName: 'chrome',
                'wdio:chromedriverOptions': { foo: 'bar' }
            } as any
        }
        const res = await startWebDriver(options)
        expect(Boolean(res?.stdout)).toBe(true)
        expect(options).toEqual({
            hostname: 'localhost',
            port: 1234,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    binary: expect.any(String),
                    prefs: { 'profile.password_manager_leak_detection': false }
                },
                'wdio:chromedriverOptions': {
                    allowedIps: ['0.0.0.0'],
                    allowedOrigins: ['*'],
                    'foo': 'bar',
                },
            }
        })
        expect(fsp.access).toBeCalledTimes(1)
        expect(cp.spawn).toBeCalledTimes(1)
        expect(cp.spawn).toBeCalledWith(
            '/foo/bar/executable',
            ['--port=1234', '--foo=bar', '--allowed-origins=*', '--allowed-ips=0.0.0.0'],
            expect.objectContaining({
                env: expect.objectContaining({
                    NODE_OPTIONS: ''
                })
            })
        )
    })

    it('should download Chromedriver from the default CDN if no custom one is set', async () => {
        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')
        expect(canDownload).toBeCalledWith(expect.objectContaining({ baseUrl: undefined }))
        expect(install).toBeCalledWith(expect.objectContaining({ baseUrl: undefined }))
    })

    it('should download Chromedriver from a custom CDN if CHROMEDRIVER_CDNURL is set', async () => {
        process.env.CHROMEDRIVER_CDNURL = 'https://artifactory.company.com/chrome-for-testing'
        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')
        expect(canDownload).toBeCalledWith(expect.objectContaining({
            baseUrl: 'https://artifactory.company.com/chrome-for-testing'
        }))
        expect(install).toBeCalledWith(expect.objectContaining({
            baseUrl: 'https://artifactory.company.com/chrome-for-testing'
        }))
    })

    it.each(['', '   ', '\n'])('should ignore a blank CHROMEDRIVER_CDNURL (%j)', async (value) => {
        /**
         * an empty variable in a CI config must fall back to the default CDN
         * instead of building an invalid url
         */
        process.env.CHROMEDRIVER_CDNURL = value
        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')
        expect(canDownload).toBeCalledWith(expect.objectContaining({ baseUrl: undefined }))
        expect(install).toBeCalledWith(expect.objectContaining({ baseUrl: undefined }))
    })

    it('should strip trailing slashes from CHROMEDRIVER_CDNURL', async () => {
        process.env.CHROMEDRIVER_CDNURL = 'https://artifactory.company.com/chrome-for-testing//'
        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')
        expect(install).toBeCalledWith(expect.objectContaining({
            baseUrl: 'https://artifactory.company.com/chrome-for-testing'
        }))
    })

    it('should redact credentials of any length', async () => {
        /**
         * registry tokens are routinely longer than a few hundred characters, so
         * the userinfo part must not be capped or a long token would survive
         */
        const token = 'T'.repeat(513)
        process.env.CHROMEDRIVER_CDNURL = `https://svc-ci:${token}@artifactory.company.com/chrome-for-testing`
        vi.mocked(install).mockRejectedValueOnce(new Error(
            `Download failed: server returned code 403. URL: https://svc-ci:${token}@artifactory.company.com/chrome-for-testing/115.0.5790.171/win64/chromedriver-win64.zip`
        ))

        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')

        const loggedError = vi.mocked(logMock.error).mock.calls.at(-1)?.[0] as string
        expect(loggedError).not.toContain(token)
        expect(loggedError).not.toContain('svc-ci')
        expect(loggedError).not.toContain('@artifactory.company.com')
        /**
         * only the scheme and everything from the host onwards may remain
         */
        expect(loggedError).toContain('https://artifactory.company.com/chrome-for-testing/115.0.5790.171/win64/chromedriver-win64.zip')
    })

    it('should not leak CHROMEDRIVER_CDNURL credentials when a download fails', async () => {
        process.env.CHROMEDRIVER_CDNURL = 'https://svc-ci:s3cr3t-token@artifactory.company.com/chrome-for-testing'
        /**
         * `@puppeteer/browsers` embeds the full download url in its error message,
         * so the credentials reach us through the error as well as through the options
         */
        vi.mocked(install).mockRejectedValueOnce(new Error(
            'Download failed: server returned code 403. URL: https://svc-ci:s3cr3t-token@artifactory.company.com/chrome-for-testing/115.0.5790.171/mac-arm64/chromedriver-mac-arm64.zip'
        ))

        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')

        const loggedError = vi.mocked(logMock.error).mock.calls.at(-1)?.[0] as string
        expect(loggedError).toContain('Failed downloading chromedriver')
        expect(loggedError).not.toContain('s3cr3t-token')
        expect(loggedError).not.toContain('svc-ci')
        expect(loggedError).toContain('https://artifactory.company.com/chrome-for-testing')

        /**
         * the download itself must still use the credentials
         */
        expect(install).toBeCalledWith(expect.objectContaining({
            baseUrl: 'https://svc-ci:s3cr3t-token@artifactory.company.com/chrome-for-testing'
        }))
    })

    it('should leave urls without credentials untouched when a download fails', async () => {
        /**
         * the redaction runs on every failed install, also for users that never set a
         * custom CDN, so it must not mangle an `@` that is part of a path or query
         */
        vi.mocked(install).mockRejectedValueOnce(new Error(
            'Download failed: server returned code 500. URL: https://storage.googleapis.com/cft?build=115@rev + https://registry.corp/npm/@scope/pkg'
        ))

        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')

        const loggedError = vi.mocked(logMock.error).mock.calls.at(-1)?.[0] as string
        expect(loggedError).toContain('https://storage.googleapis.com/cft?build=115@rev')
        expect(loggedError).toContain('https://registry.corp/npm/@scope/pkg')
    })

    it.each([
        ['a plain object', { code: 'ECONNRESET' }, '{"code":"ECONNRESET"}'],
        ['a string', 'ECONNRESET', 'ECONNRESET'],
        ['null', null, 'null'],
        ['undefined', undefined, 'undefined']
    ])('should describe an install rejection that is %s', async (_name, rejection, expected) => {
        /**
         * a rejection is not guaranteed to be an Error: neither assigning to
         * `message` nor `new Error(obj)` is safe, and the reason has to survive
         * into the thrown error rather than becoming `[object Object]`
         */
        vi.mocked(install).mockRejectedValue(rejection as never)

        const err = await setupChromedriver('/foo/bar/cache', '115.0.5790.171').catch((e: Error) => e) as Error

        expect(err).toBeInstanceOf(Error)
        expect(err.message).toContain('Failed downloading chromedriver')
        expect(err.message).toContain(expected)
        expect(err.message).not.toContain('[object Object]')
        expect(err.message).not.toContain('Cannot read properties')
    })

    it('should redact a large message without stalling', async () => {
        /**
         * an unbounded scheme quantifier backtracks quadratically, which turned a
         * 200kb message into a ~48s stall inside the error handler
         */
        const huge = `${'a'.repeat(200_000)}://${'b'.repeat(200_000)}`
        vi.mocked(install).mockRejectedValueOnce(new Error(huge))

        const start = Date.now()
        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')
        expect(Date.now() - start).toBeLessThan(2_000)
    })

    it('should not leak CHROMEDRIVER_CDNURL credentials in the thrown error when the retry fails', async () => {
        process.env.CHROMEDRIVER_CDNURL = 'https://svc-ci:s3cr3t-token@artifactory.company.com/chrome-for-testing'
        vi.mocked(install).mockRejectedValue(new Error(
            'Download failed: server returned code 403. URL: https://svc-ci:s3cr3t-token@artifactory.company.com/chrome-for-testing/115.0.5790.171/mac-arm64/chromedriver-mac-arm64.zip'
        ))

        const err = await setupChromedriver('/foo/bar/cache', '115.0.5790.171').catch((e: Error) => e) as Error

        expect(err).toBeInstanceOf(Error)
        expect(err.message).not.toContain('s3cr3t-token')
        expect(err.message).not.toContain('svc-ci')
    })

    it('should start driver with no prefs if debuggerAddress is set', async () => {
        const options = {
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': { debuggerAddress: 'localhost:9222' }
            } as any
        }
        const res = await startWebDriver(options)
        expect(Boolean(res?.stdout)).toBe(true)
        expect(options).toEqual({
            hostname: 'localhost',
            port: 1234,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    // no prefs should be set in this case
                    binary: expect.any(String),
                    debuggerAddress: 'localhost:9222'
                }
            }
        })
    })

    it('should start no driver or download chrome if binaries are defined', async () => {
        const options = {
            capabilities: {
                browserName: 'chrome',
                'wdio:chromedriverOptions': { binary: '/my/chromedriver' },
                'goog:chromeOptions': { binary: '/my/chrome' }
            } as any
        }
        const res = await startWebDriver(options)
        expect(Boolean(res?.stdout)).toBe(true)
        expect(options).toEqual({
            hostname: 'localhost',
            port: 1234,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    binary: '/my/chrome',
                    prefs: { 'profile.password_manager_leak_detection': false }
                },
                'wdio:chromedriverOptions': {
                    allowedIps: ['0.0.0.0'],
                    allowedOrigins: ['*'],
                    binary: '/my/chromedriver'
                },
            }
        })
        expect(cp.spawn).toBeCalledTimes(1)
        expect(cp.spawn).toBeCalledWith(
            '/my/chromedriver',
            ['--port=1234', '--binary=/my/chromedriver', '--allowed-origins=*', '--allowed-ips=0.0.0.0'],
            expect.objectContaining({
                env: expect.objectContaining({
                    NODE_OPTIONS: ''
                })
            })
        )
    })

    it('should start no driver or download geckodriver if binaries are defined', async () => {
        const options = {
            capabilities: {
                browserName: 'firefox',
                'wdio:geckodriverOptions': { binary: '/my/geckodriver' },
                'moz:firefoxOptions': { binary: '/my/firefox' }
            } as any
        }
        const res = await startWebDriver(options)
        expect(res).toBe('geckodriver')
        expect(startGeckodriver).toBeCalledWith({
            cacheDir: expect.any(String),
            allowHosts: ['localhost'],
            customGeckoDriverPath: '/my/geckodriver',
            port: 1234
        })
    })

    it('should start no driver or download edgedriver if binaries are defined', async () => {
        const options = {
            capabilities: {
                browserName: 'edge',
                'wdio:edgedriverOptions': { binary: '/my/edgedriver' },
                'ms:edgeOptions': { binary: '/my/edge' }
            } as any
        }
        const res = await startWebDriver(options)
        expect(res).toBe('edgedriver')
        expect(startEdgedriver).toBeCalledWith({
            cacheDir: expect.any(String),
            allowedIps: ['0.0.0.0'],
            customEdgeDriverPath: '/my/edgedriver',
            port: 1234
        })
    })

    it('should fail on timeout', async () => {
        const options = {
            capabilities: {
                browserName: 'chrome',
                'wdio:chromedriverOptions': { foo: 'bar' }
            } as any
        }
        vi.mocked(waitPort).mockRejectedValueOnce(new Error('timeout'))
        await expect(startWebDriver(options)).rejects.toThrow('Timed out to connect to Chromedriver')
        expect(waitPort).toBeCalledWith(expect.objectContaining({ timeout: 10 * 1000 }))
    })

    it('should find last known good version for chromedriver', async () => {
        const options = {
            capabilities: {
                browserName: 'chrome',
                browserVersion: '115.0.5790.171',
                'wdio:chromedriverOptions': { foo: 'bar' }
            } as any
        }
        vi.mocked(install)
            .mockResolvedValueOnce({} as any)
            .mockResolvedValue({} as any)
        await startWebDriver(options)
        expect(install).toBeCalledTimes(1)
        expect(install).toBeCalledWith(expect.objectContaining({
            buildId: '115.0.5790.171',
            browser: 'chromedriver'
        }))
    })

    it('should name the custom CDN when the driver could not be found there', async () => {
        process.env.CHROMEDRIVER_CDNURL = 'https://svc-ci:s3cr3t-token@artifactory.company.com/chrome-for-testing'
        vi.mocked(canDownload).mockResolvedValueOnce(false)

        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')

        const warning = vi.mocked(logMock.warn).mock.calls.at(-1)?.[0] as string
        expect(warning).toContain('CHROMEDRIVER_CDNURL')
        expect(warning).toContain('https://artifactory.company.com/chrome-for-testing')
        expect(warning).not.toContain('s3cr3t-token')

        /**
         * the known good version has to come from the mirror as well, otherwise the
         * fallback would quietly download from the public CDN
         */
        expect(install).toBeCalledWith(expect.objectContaining({
            baseUrl: 'https://svc-ci:s3cr3t-token@artifactory.company.com/chrome-for-testing'
        }))
    })

    it('should not mention a custom CDN when none is configured', async () => {
        vi.mocked(canDownload).mockResolvedValueOnce(false)

        await setupChromedriver('/foo/bar/cache', '115.0.5790.171')

        const warning = vi.mocked(logMock.warn).mock.calls.at(-1)?.[0] as string
        expect(warning).toContain('trying to find known good version')
        expect(warning).not.toContain('CHROMEDRIVER_CDNURL')
    })

    it('should pipe logs into a file', async () => {
        const options: any = {
            outputDir: '/foo/bar',
            capabilities: {
                browserName: 'chrome',
                'wdio:chromedriverOptions': { foo: 'bar' }
            } as any
        }

        await startWebDriver(options)
        expect(fs.createWriteStream).toBeCalledTimes(1)
        expect(fs.createWriteStream).toBeCalledWith(
            expect.stringContaining('wdio-chromedriver-1234.log'),
            { flags: 'w' }
        )

        process.env.WDIO_WORKER_ID = '1-2'
        delete options.hostname
        delete options.port
        await startWebDriver(options)
        expect(fs.createWriteStream).toBeCalledTimes(2)
        expect(fs.createWriteStream).toBeCalledWith(
            expect.stringContaining('wdio-1-2-chromedriver.log'),
            { flags: 'w' }
        )
    })

    it('should skip desktop Firefox download and binary injection when androidPackage is set', async () => {
        const { setupPuppeteerBrowser } = await import('../../src/node/utils.js')
        vi.mocked(setupPuppeteerBrowser).mockClear()

        const params = {
            capabilities: {
                browserName: 'firefox',
                'moz:firefoxOptions': {
                    androidPackage: 'org.mozilla.fenix',
                    androidDeviceSerial: 'emulator-5554'
                }
            } as any
        }
        const res = await startWebDriver(params)
        expect(res).toBe('geckodriver')
        expect(setupPuppeteerBrowser).not.toBeCalled()
        expect(params.capabilities['moz:firefoxOptions']).not.toHaveProperty('binary')
        expect(params.capabilities['moz:firefoxOptions'].androidPackage).toBe('org.mozilla.fenix')
        expect(startGeckodriver).toBeCalledTimes(1)
    })

    it('should skip desktop Chrome download and binary injection when androidPackage is set', async () => {
        const { setupPuppeteerBrowser } = await import('../../src/node/utils.js')
        vi.mocked(setupPuppeteerBrowser).mockClear()
        vi.mocked(cp.spawn).mockClear()

        const params = {
            capabilities: {
                browserName: 'chrome',
                'wdio:chromedriverOptions': { binary: '/my/chromedriver' },
                'goog:chromeOptions': {
                    androidPackage: 'com.android.chrome',
                    androidDeviceSerial: 'emulator-5554'
                }
            } as any
        }
        const res = await startWebDriver(params)
        expect(Boolean(res?.stdout)).toBe(true)
        expect(setupPuppeteerBrowser).not.toBeCalled()
        expect(params.capabilities['goog:chromeOptions']).not.toHaveProperty('binary')
        expect(params.capabilities['goog:chromeOptions'].androidPackage).toBe('com.android.chrome')
        expect(cp.spawn).toBeCalledTimes(1)
    })

    it('should not start or download driver for appium capabilities', async () => {
        const options = {
            hostname: 'localhost',
            protocol: 'http',
            path: '/',
            capabilities: {
                'appium:automationName': 'appium'
            } as any
        }
        const res = await startWebDriver(options)
        expect(res).toBe(undefined)
        expect(options).toEqual({
            hostname: 'localhost',
            protocol: 'http',
            path: '/',
            capabilities: {
                'appium:automationName': 'appium'
            }
        })
        expect(cp.spawn).not.toBeCalled()
        expect(fs.createWriteStream).not.toBeCalled()
    })

    it('should throw an error if the provided capabilities do not include browserName', async () => {
        const options = {
            capabilities: {
                browserVersion: '100'
            } as any
        }
        await expect(async () => await startWebDriver(options)).rejects.toThrow(
            new Error(
                'No "browserName" defined in capabilities nor hostname or port found!\n' +
                'If you like to run a local browser session make sure to pick from one of ' +
                `the following browser names: ${Object.values(SUPPORTED_BROWSERNAMES).flat(Infinity)}`
            )
        )
    })
    it('should add a unique user-data-dir on Windows for Chrome workers', async () => {
        // Change the mocked OS to Windows
        // @ts-ignore
        os.__setPlatform('win32')

        const originalPlatform = process.platform
        Object.defineProperty(process, 'platform', {
            value: 'win32',
            writable: true,
            configurable: true
        })

        // Simulate WDIO worker env
        process.env.WDIO_WORKER_ID = '0-1'

        // Reset mocks
        vi.mocked(fsp.mkdir).mockClear()
        vi.mocked(cp.spawn).mockClear()

        const options: any = {
            capabilities: {
                browserName: 'chrome',
                'wdio:chromedriverOptions': { foo: 'bar' }
            }
        }

        const result = await startWebDriver(options)

        expect(Boolean(result?.stdout)).toBe(true)

        // startWebDriver does not create the directory, it just passes the path to Chrome
        expect(fsp.mkdir).not.toBeCalled()

        expect(cp.spawn).toBeCalledTimes(1)

        // Check that the user-data-dir was added to the chromeOptions args
        const chromeArgs = options.capabilities['goog:chromeOptions'].args
        const userDataArg = chromeArgs.find((a: string) =>
            a.startsWith('--user-data-dir=')
        )

        expect(userDataArg).toBeDefined()
        expect(userDataArg).toContain('wdio-chrome-')
        expect(userDataArg).toContain('0-1')

        delete process.env.WDIO_WORKER_ID
        // @ts-ignore
        // @ts-ignore
        os.__setPlatform('linux')
        Object.defineProperty(process, 'platform', {
            value: originalPlatform,
            writable: true,
            configurable: true
        })
        vi.restoreAllMocks()
    })
})
