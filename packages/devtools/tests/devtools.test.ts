import path from 'path'
import { expect, test, vi, beforeEach } from 'vitest'
import type { Capabilities } from '@wdio/types'
import launch from '../src/launcher'
import DevTools from '../src'

vi.mock('@wdio/logger', () => import(path.join(process.cwd(), '__mocks__', '@wdio/logger')))
vi.mock('../src/launcher', () => ({
    default: vi.fn().mockImplementation((capabilities) => {
        capabilities['goog:chromeOptions'] = capabilities['goog:chromeOptions'] || {}
        return {
            on: vi.fn(),
            pages: vi.fn().mockReturnValue(Promise.resolve([{
                on: vi.fn(),
                setDefaultTimeout: vi.fn()
            }])),
            _connection: {
                url: () => 'ws://localhost:49375/devtools/browser/c4b017ea-f476-4026-a699-bc5d4858cfe1'
            },
            userAgent: vi.fn().mockReturnValue(Promise.resolve('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36'))
        }
    })
}))

beforeEach(() => {
    vi.mocked(launch).mockClear()
})

test('newSession', async () => {
    const client: any = await DevTools.newSession({
        logLevel: 'trace',
        capabilities: {
            browserName: 'chrome'
        }
    })

    /**
     * don't include platform specific information in snapshot
     */
    delete (client.options.capabilities as Capabilities.DesiredCapabilities).platformName
    delete (client.options.capabilities as Capabilities.DesiredCapabilities).platformVersion

    expect(client.options.capabilities).toMatchSnapshot()
    expect(client.options.requestedCapabilities).toMatchSnapshot()
    expect(client.isDevTools).toBe(true)
    expect(client.isChrome).toBe(true)
    expect(client.isW3C).toBe(true)
    expect(launch).toBeCalledTimes(1)
})

test('reloadSession', async () => {
    const client = await DevTools.newSession({
        logLevel: 'trace',
        capabilities: {
            browserName: 'chrome'
        }
    })
    const origSessionId = client.sessionId
    const newClient = await DevTools.reloadSession(client)
    expect(origSessionId).toBe(newClient)
})

test('attachSession', async () => {
    const client: any = await DevTools.newSession({
        logLevel: 'trace',
        capabilities: {
            browserName: 'chrome'
        }
    })
    const otherClient: any = await DevTools.attachToSession(client)

    /**
     * don't include platform specific information in snapshot
     */
    delete (otherClient.options.capabilities as Capabilities.DesiredCapabilities).platformName
    delete (otherClient.options.capabilities as Capabilities.DesiredCapabilities).platformVersion

    expect(otherClient.capabilities).toMatchSnapshot()
    expect(otherClient.requestedCapabilities).toMatchSnapshot()
    expect(otherClient.isDevTools).toBe(true)
    expect(otherClient.isChrome).toBe(true)
    expect(otherClient.isW3C).toBe(true)
    expect(launch).toBeCalledTimes(2)
})
