import launch from '../src/launcher'
import DevTools from '../src'

jest.mock('../src/launcher', () => jest.fn().mockImplementation((capabilities) => {
    capabilities['goog:chromeOptions'] = capabilities['goog:chromeOptions'] || {}
    return {
        on: jest.fn(),
        pages: jest.fn().mockReturnValue(Promise.resolve([{
            on: jest.fn(),
            setDefaultTimeout: jest.fn()
        }])),
        _connection: {
            url: () => 'ws://localhost:49375/devtools/browser/c4b017ea-f476-4026-a699-bc5d4858cfe1'
        },
        userAgent: jest.fn().mockReturnValue(Promise.resolve('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.149 Safari/537.36'))
    }
}))

beforeEach(() => {
    (launch as jest.Mock).mockClear()
})

test('newSession', async () => {
    const client = await DevTools.newSession({
        logLevel: 'trace',
        capabilities: {
            browserName: 'chrome'
        }
    })

    /**
     * don't include platform specific information in snapshot
     */
    delete client.options.capabilities.platformName
    delete client.options.capabilities.platformVersion

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
    const client = await DevTools.newSession({
        logLevel: 'trace',
        capabilities: {
            browserName: 'chrome'
        }
    })
    const otherClient = await DevTools.attachToSession(client)

    /**
     * don't include platform specific information in snapshot
     */
    delete otherClient.options.capabilities.platformName
    delete otherClient.options.capabilities.platformVersion

    expect(otherClient.capabilities).toMatchSnapshot()
    expect(otherClient.requestedCapabilities).toMatchSnapshot()
    expect(otherClient.isDevTools).toBe(true)
    expect(otherClient.isChrome).toBe(true)
    expect(otherClient.isW3C).toBe(true)
    expect(launch).toBeCalledTimes(2)
})
