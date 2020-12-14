// @ts-ignore mocked (original defined in webdriver package)
import got from 'got'
import puppeteer from 'puppeteer-core'

import { remote } from '../../../src'

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

    let err = await browser.throttle().catch((err: Error) => err)
    expect(err.message).toContain('Invalid parameter for "throttle"')
    err = await browser.throttle(123).catch((err: Error) => err)
    expect(err.message).toContain('Invalid parameter for "throttle"')
    err = await browser.throttle('FOOBAR').catch((err: Error) => err)
    expect(err.message).toContain('Invalid parameter for "throttle"')
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

    await browser.throttle('Regular3G')
    expect(got.mock.calls[1][0].href)
        .toContain('/sauce/ondemand/throttle/network')
})

test('should allow to send strings as param', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    await browser.throttle('Regular3G')
    expect(cdpSession.send.mock.calls).toMatchSnapshot()
})

test('should allow to send objects as param', async () => {
    const browser = await remote({
        capabilities: {
            browserName: 'devtools'
        }
    })

    await browser.throttle({ foo: 'bar' })
    expect(cdpSession.send).toBeCalledWith(
        'Network.emulateNetworkConditions',
        { foo: 'bar' })
})
