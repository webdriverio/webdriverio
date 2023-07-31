import fs from 'node:fs/promises'
import cp from 'node:child_process'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import { start as startSafaridriver } from 'safaridriver'
import { start as startGeckodriver } from 'geckodriver'
import { start as startEdgedriver } from 'edgedriver'

import { startWebDriver } from '../../src/driver/index.js'

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockRejectedValue(new Error('boom')),
        mkdir: vi.fn()
    }
}))

vi.mock('node:child_process', () => ({
    default: {
        spawn: vi.fn().mockReturnValue('cp'),
        execSync: vi.fn().mockReturnValue(Buffer.from('115.0.5790.98'))
    }
}))

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('devtools', () => ({ default: 'devtools package' }))
vi.mock('webdriver', () => ({ default: 'webdriver package' }))
vi.mock('safaridriver', () => ({ start: vi.fn().mockReturnValue('safaridriver') }))
vi.mock('edgedriver', () => ({ start: vi.fn().mockResolvedValue('edgedriver') }))
vi.mock('geckodriver', () => ({ start: vi.fn().mockResolvedValue('geckodriver') }))
vi.mock('wait-port', () => ({ default: vi.fn() }))
vi.mock('get-port', () => ({ default: vi.fn().mockResolvedValue(1234) }))

vi.mock('@puppeteer/browsers', () => ({
    Browser: { CHROME: 'chrome' },
    ChromeReleaseChannel: { STABLE: 'stable' },
    detectBrowserPlatform: vi.fn().mockReturnValue('mac_arm'),
    resolveBuildId: vi.fn().mockReturnValue('115.0.5790.98'),
    canDownload: vi.fn().mockResolvedValue(true),
    computeExecutablePath: vi.fn().mockReturnValue('/foo/bar/executable'),
    getInstalledBrowsers: vi.fn().mockResolvedValue([]),
    install: vi.fn()
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
        await expect(startWebDriver(options)).resolves.toBe('cp')
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
        expect(fs.access).toBeCalledTimes(2)
        expect(fs.mkdir).toBeCalledTimes(1)
        expect(cp.spawn).toBeCalledTimes(1)
        expect(cp.spawn).toBeCalledWith(
            '/foo/bar/executable',
            ['--port=1234', '--foo=bar', '--allowed-origins=*', '--allowed-ips=']
        )
    })
})
