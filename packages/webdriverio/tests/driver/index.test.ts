import fs from 'node:fs/promises'
import cp from 'node:child_process'
import path from 'node:path'
import { describe, it, expect, vi } from 'vitest'

import { start as startSafaridriver } from 'safaridriver'
import { start as startGeckodriver } from 'geckodriver'
import { start as startEdgedriver } from 'edgedriver'

import { getProtocolDriver, startWebDriver } from '../../src/driver/index.js'

vi.mock('node:fs/promises', () => ({
    default: {
        access: vi.fn().mockRejectedValue(new Error('boom')),
        mkdir: vi.fn()
    }
}))

vi.mock('node:child_process', () => ({
    default: {
        spawn: vi.fn().mockReturnValue('cp')
    }
}))

vi.mock('devtools', () => ({ default: 'devtools package' }))
vi.mock('webdriver', () => ({ default: 'webdriver package' }))
vi.mock('safaridriver', () => ({ start: vi.fn() }))
vi.mock('edgedriver', () => ({ start: vi.fn() }))
vi.mock('geckodriver', () => ({ start: vi.fn() }))
vi.mock('wait-port', () => ({ default: vi.fn() }))
vi.mock('get-port', () => ({ default: vi.fn().mockResolvedValue(1234) }))

vi.mock('@puppeteer/browsers', () => ({
    Browser: { CHROME: 'chrome' },
    ChromeReleaseChannel: { STABLE: 'stable' },
    detectBrowserPlatform: vi.fn(),
    resolveBuildId: vi.fn().mockReturnValue('115.0.5790.98'),
    canDownload: vi.fn().mockResolvedValue(true),
    computeExecutablePath: vi.fn().mockReturnValue('/foo/bar/executable'),
    install: vi.fn()
}))

vi.mock('../../src/driver/detectBackend.js', () => ({
    default: vi.fn().mockReturnValue({
        hostname: 'cloudprovider.com'
    })
}))

vi.mock('../../src/driver/utils.js', async () => ({
    parseParams: (await import('../../src/driver/utils.js')).parseParams,
    setupChrome: vi.fn().mockResolvedValue({
        executablePath: '/foo/bar',
        buildId: '115.0.5790.98',
        platform: 'mac'
    })
}))

describe('driver utils', () => {
    describe('getProtocolDriver', () => {
        it('should return devtools driver', async () => {
            await expect(getProtocolDriver({ automationProtocol: 'devtools' } as any)).resolves.toEqual({
                Driver: 'devtools package',
                options: { automationProtocol: 'devtools' }
            })
        })

        it('should return WebDriver with cloud connection details', async () => {
            await expect(getProtocolDriver({
                user: 'foo',
                key: 'bar',
                capabilities: {
                    browserName: 'safari',
                    'wdio:safaridriverOptions': { foo: 'bar' }
                } as any
            })).resolves.toEqual({
                Driver: 'webdriver package',
                options: {
                    capabilities: {
                        browserName: 'safari',
                        'wdio:safaridriverOptions': { foo: 'bar' }
                    },
                    hostname: 'cloudprovider.com',
                    user: 'foo',
                    key: 'bar'
                }
            })
        })
    })

    describe('startWebDriver', () => {
        it('should start safari driver', async () => {
            await expect(startWebDriver({
                capabilities: {
                    browserName: 'safari',
                    'wdio:safaridriverOptions': { foo: 'bar' }
                } as any
            })).resolves.toEqual({
                driverProcess: undefined,
                hostname: '0.0.0.0',
                port: 1234
            })
            expect(startSafaridriver).toBeCalledTimes(1)
            expect(startSafaridriver).toBeCalledWith({ port: 1234, foo: 'bar' })
        })

        it('should start firefox driver', async () => {
            await expect(startWebDriver({
                capabilities: {
                    browserName: 'firefox',
                    'wdio:geckodriverOptions': { foo: 'bar' }
                } as any
            })).resolves.toEqual({
                driverProcess: undefined,
                hostname: '0.0.0.0',
                port: 1234
            })
            expect(startGeckodriver).toBeCalledTimes(1)
            expect(startGeckodriver).toBeCalledWith({ port: 1234, foo: 'bar' })
        })

        it('should start edge driver', async () => {
            const options = {
                capabilities: {
                    browserName: 'edge',
                    'wdio:edgedriverOptions': { foo: 'bar' }
                } as any
            }
            await expect(startWebDriver(options)).resolves.toEqual({
                driverProcess: undefined,
                hostname: '0.0.0.0',
                port: 1234
            })
            expect(startEdgedriver).toBeCalledTimes(1)
            expect(startEdgedriver).toBeCalledWith({
                foo: 'bar',
                port: 1234,
                allowedIps: [''],
                allowedOrigins: ['*']
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
            await expect(startWebDriver(options)).resolves.toEqual({
                driverProcess: 'cp',
                hostname: '0.0.0.0',
                port: 1234
            })
            expect(fs.access).toBeCalledTimes(1)
            expect(fs.access).toBeCalledWith(path.resolve(__dirname, '..', '..', '.chrome'))
            expect(fs.mkdir).toBeCalledTimes(1)
            expect(fs.mkdir).toBeCalledWith(path.resolve(__dirname, '..', '..', '.chrome'), { recursive: true })
            expect(options.capabilities['goog:chromeOptions'].binary).toEqual('/foo/bar')
            expect(cp.spawn).toBeCalledTimes(1)
            expect(cp.spawn).toBeCalledWith(
                '/foo/bar/executable',
                ['--port=1234', '--foo=bar', '--allowed-origins=*', '--allowed-ips=']
            )
        })
    })
})
