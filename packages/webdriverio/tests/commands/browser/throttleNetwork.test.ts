import path from 'node:path'
import { expect, test, beforeEach, vi } from 'vitest'
import puppeteer from 'puppeteer-core'

import { remote } from '../../../src/index.js'

vi.mock('fetch')
vi.mock('puppeteer-core')
/**
 * Given that Puppeteer is not a direct dependency of this package, we can't mock
 * it and dynamically import it. Instead, we mock the "userImport" helper and make
 * it resolve to the mocked Puppeteer.
 */
vi.mock('@wdio/utils', async (origMod) => {
    const orig = await origMod() as any
    // resolve the mocked puppeteer-core
    const puppeteer = await import('puppeteer-core')
    return {
        ...orig,
        userImport: vi.fn().mockResolvedValue(puppeteer.default)
    }
})
vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))

// @ts-ignore mock feature
const cdpSession = new puppeteer.CDPSessionMock()

beforeEach(() => {
    vi.mocked(fetch).mockClear()
    cdpSession.send.mockClear()
})

test('should fail if wrong params applied', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    // @ts-expect-error wrong parameter
    let err: Error = await browser.throttleNetwork().catch((err: Error) => err)
    expect(err.message).toContain('Invalid parameter for "throttleNetwork"')
    // @ts-expect-error wrong parameter
    err = await browser.throttleNetwork(123).catch((err: Error) => err)
    expect(err.message).toContain('Invalid parameter for "throttleNetwork"')
    // @ts-expect-error wrong parameter
    err = await browser.throttleNetwork('FOOBAR').catch((err: Error) => err)
    expect(err.message).toContain('Invalid parameter for "throttleNetwork"')
})

test('should use WebDriver extension if run on Sauce', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'foobar',
            'sauce:options': {
                extendedDebugging: true
            }
        }
    })

    await browser.throttleNetwork('Regular3G')
    // @ts-expect-error mock implementation
    expect(vi.mocked(fetch).mock.calls[1][0].href)
        .toContain('/sauce/ondemand/throttle/network')
})

test('should allow to send strings as param', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    await browser.throttleNetwork('Regular3G')
    expect(cdpSession.send.mock.calls).toMatchSnapshot()
})

test('should allow to send objects as param', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    // @ts-expect-error wrong parameter
    await browser.throttleNetwork({ foo: 'bar' })
    expect(cdpSession.send).toBeCalledWith(
        'Network.emulateNetworkConditions',
        { foo: 'bar' })
})

test('should apply throttling to registered service workers', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    const serviceWorkerSession = { send: vi.fn() }
    const serviceWorkerTarget = {
        type: vi.fn().mockReturnValue('service_worker'),
        createCDPSession: vi.fn().mockResolvedValue(serviceWorkerSession)
    }
    /**
     * every connect call creates a new mock instance without a `connected`
     * flag, so pin `puppeteer.connect` to a single instance we control
     */
    const puppeteerMock = new (puppeteer as any).PuppeteerMock()
    puppeteerMock.targets = vi.fn().mockReturnValue([serviceWorkerTarget])
    vi.mocked(puppeteer.connect).mockResolvedValue(puppeteerMock)

    await browser.throttleNetwork('offline')

    expect(serviceWorkerTarget.createCDPSession).toBeCalledTimes(1)
    expect(serviceWorkerSession.send).toBeCalledWith('Network.enable')
    expect(serviceWorkerSession.send).toBeCalledWith('Network.emulateNetworkConditions', {
        offline: true,
        downloadThroughput: 0,
        uploadThroughput: 0,
        latency: 1
    })
})

test('should not touch sessions of non service worker targets', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    const otherSession = { send: vi.fn() }
    const otherTarget = {
        type: vi.fn().mockReturnValue('iframe'),
        createCDPSession: vi.fn().mockResolvedValue(otherSession)
    }
    const puppeteerMock = new (puppeteer as any).PuppeteerMock()
    puppeteerMock.targets = vi.fn().mockReturnValue([otherTarget])
    vi.mocked(puppeteer.connect).mockResolvedValue(puppeteerMock)

    await browser.throttleNetwork('offline')

    expect(otherTarget.createCDPSession).not.toBeCalled()
    expect(otherSession.send).not.toBeCalled()
})
