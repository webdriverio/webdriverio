import path from 'node:path'
import { expect, test, beforeEach, vi } from 'vitest'
// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import puppeteer from 'puppeteer-core'

import { remote } from '../../../src/index.js'

vi.mock('got')
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
    got.mockClear()
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
    expect(got.mock.calls[1][0].href)
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
