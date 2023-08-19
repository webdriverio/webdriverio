import fsp from 'node:fs/promises'
import cp from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { start as startSafaridriver } from 'safaridriver'
import { start as startGeckodriver } from 'geckodriver'
import { start as startEdgedriver } from 'edgedriver'
import { install } from '@puppeteer/browsers'

import { startWebDriver } from '../../src/driver/index.js'

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

vi.mock('node:child_process', () => ({
    default: {
        spawn: vi.fn().mockReturnValue({
            stdout: { pipe: vi.fn() },
            stderr: { pipe: vi.fn() }
        }),
        execSync: vi.fn().mockReturnValue(Buffer.from('115.0.5790.171'))
    }
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('devtools', () => ({ default: 'devtools package' }))
vi.mock('webdriver', () => ({ default: 'webdriver package' }))
vi.mock('safaridriver', () => ({ start: vi.fn().mockReturnValue('safaridriver') }))
vi.mock('edgedriver', () => ({
    start: vi.fn().mockResolvedValue('edgedriver'),
    findEdgePath: vi.fn().mockResolvedValue('/foo/bar/executable')
}))
vi.mock('geckodriver', () => ({ start: vi.fn().mockResolvedValue('geckodriver') }))
vi.mock('wait-port', () => ({ default: vi.fn() }))
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

vi.mock('../../src/driver/detectBackend.js', () => ({
    default: vi.fn().mockReturnValue({
        hostname: 'cloudprovider.com'
    })
}))

describe('startWebDriver', () => {
    const WDIO_SKIP_DRIVER_SETUP = process.env.WDIO_SKIP_DRIVER_SETUP
    beforeEach(() => {
        delete process.env.WDIO_SKIP_DRIVER_SETUP
        vi.mocked(install).mockClear()
    })

    afterEach(() => {
        process.env.WDIO_SKIP_DRIVER_SETUP = WDIO_SKIP_DRIVER_SETUP
    })

    it('should start safari driver', async () => {
        const params = {
            capabilities: {
                browserName: 'safari',
                'wdio:safaridriverOptions': { foo: 'bar' }
            } as any
        }
        await expect(startWebDriver(params)).resolves.toBe('safaridriver')
        await expect(params).toEqual({
            hostname: '0.0.0.0',
            port: 1234,
            capabilities: {
                browserName: 'safari',
                'wdio:safaridriverOptions': {
                    foo: 'bar'
                },
            },
            headers: {
                Host: 'localhost',
            },
        })
        expect(startSafaridriver).toBeCalledTimes(1)
        expect(startSafaridriver).toBeCalledWith({
            port: 1234,
            foo: 'bar',
            useTechnologyPreview: false
        })
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
            hostname: '0.0.0.0',
            port: 1234,
            capabilities: {
                browserName: 'firefox',
                'wdio:geckodriverOptions': {
                    foo: 'bar'
                },
            }
        })
        expect(startGeckodriver).toBeCalledTimes(1)
        expect(startGeckodriver).toBeCalledWith({
            port: 1234,
            foo: 'bar',
            cacheDir: expect.any(String)
        })
    })

    it('should start edge driver', async () => {
        const options = {
            capabilities: {
                browserName: 'edge',
                'wdio:edgedriverOptions': { foo: 'bar' }
            } as any
        }
        await expect(startWebDriver(options)).resolves.toBe('edgedriver')
        expect(options).toEqual({
            hostname: '0.0.0.0',
            port: 1234,
            capabilities: {
                browserName: 'MicrosoftEdge',
                'wdio:edgedriverOptions': {
                    foo: 'bar'
                },
            }
        })
        expect(startEdgedriver).toBeCalledTimes(1)
        expect(startEdgedriver).toBeCalledWith({
            foo: 'bar',
            port: 1234,
            cacheDir: expect.any(String)
        })
        expect(options.capabilities.browserName).toBe('MicrosoftEdge')
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
            hostname: '0.0.0.0',
            port: 1234,
            capabilities: {
                browserName: 'chrome',
                'goog:chromeOptions': {
                    binary: expect.any(String)
                },
                'wdio:chromedriverOptions': {
                    allowedIps: [''],
                    allowedOrigins: ['*'],
                    'foo': 'bar',
                },
            }
        })
        expect(fsp.access).toBeCalledTimes(2)
        expect(fsp.mkdir).toBeCalledTimes(1)
        expect(cp.spawn).toBeCalledTimes(1)
        expect(cp.spawn).toBeCalledWith(
            '/foo/bar/executable',
            ['--port=1234', '--foo=bar', '--allowed-origins=*', '--allowed-ips=']
        )
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
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValue({} as any)
        await startWebDriver(options)
        expect(install).toBeCalledTimes(3)
        expect(install).toBeCalledWith(expect.objectContaining({
            buildId: '115.0.5790.171',
            browser: 'chrome'
        }))
        expect(install).toBeCalledWith(expect.objectContaining({
            buildId: '115.0.5790.171',
            browser: 'chromedriver'
        }))
        expect(install).toBeCalledWith(expect.objectContaining({
            buildId: '115.0.5790.170',
            browser: 'chromedriver'
        }))
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
})
